/**
 * Robust Yahoo Finance Service (browser-compatible)
 * Uses multiple CORS proxies with automatic fallback and retry.
 * Falls back to Alpha Vantage on complete failure.
 */

import { getAlphaVantageDaily } from './alphaVantage';

export interface HistoricalPrice {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

// Multiple proxy endpoints tried in order
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${url}`,
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch JSON from a URL through multiple CORS proxies, with retry.
 */
async function fetchWithProxyFallback(url: string): Promise<any> {
  let lastError: any;

  for (let pi = 0; pi < CORS_PROXIES.length; pi++) {
    const proxyUrl = CORS_PROXIES[pi](url);
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
        const response = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const text = await response.text();
        if (!text || text.trim() === '') throw new Error('Empty response');
        return JSON.parse(text);
      } catch (e: any) {
        lastError = e;
        if (attempt === 0) await sleep(500); // brief pause before retry
      }
    }
    // Try next proxy
  }
  throw lastError ?? new Error('All proxies failed');
}

/**
 * Parse the Yahoo Finance v7 chart API response into HistoricalPrice[]
 */
function parseChartResponse(data: any): HistoricalPrice[] {
  const chart = data?.chart?.result?.[0];
  if (!chart) throw new Error('Invalid chart data structure');

  const timestamps: number[] = chart.timestamp;
  if (!timestamps || timestamps.length === 0) return [];

  const quotes = chart.indicators?.quote?.[0];
  if (!quotes) throw new Error('No quote data');

  const adjClose: (number | null)[] = chart.indicators?.adjclose?.[0]?.adjclose || quotes.close;

  return timestamps
    .map((t: number, i: number) => ({
      date: new Date(t * 1000).toISOString().split('T')[0],
      close: adjClose[i] ?? quotes.close[i],
      open: quotes.open[i],
      high: quotes.high[i],
      low: quotes.low[i],
      volume: quotes.volume[i],
    }))
    .filter((d): d is HistoricalPrice =>
      d.close != null && !isNaN(d.close) && d.close > 0
    );
}

export const yahooFinance = {
  /**
   * Fetch historical data with YFinance-style tickers (e.g. RELIANCE.NS, AAPL)
   * Automatically tries multiple proxies and falls back to Alpha Vantage.
   */
  getHistoricalData: async (
    ticker: string,
    period: '1mo' | '3mo' | '1y' | '5y' | 'max' = '1y',
    interval: '1d' | '1wk' | '1mo' = '1d'
  ): Promise<HistoricalPrice[]> => {
    // Try Yahoo Finance via multiple proxies
    try {
      const now = Math.floor(Date.now() / 1000);
      const periodMap: Record<string, number> = {
        '1mo': 30 * 86400,
        '3mo': 90 * 86400,
        '1y': 365 * 86400,
        '5y': 5 * 365 * 86400,
        'max': now, // start from epoch 0
      };
      const start = period === 'max' ? 0 : now - periodMap[period];

      // Try both Yahoo Finance v7 and v8 endpoints
      const endpoints = [
        `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${start}&period2=${now}&interval=${interval}&includePrePost=false&events=div,splits`,
        `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${start}&period2=${now}&interval=${interval}&events=history`,
        `https://query1.finance.yahoo.com/v7/finance/chart/${ticker}?period1=${start}&period2=${now}&interval=${interval}&events=history`,
      ];

      for (const endpoint of endpoints) {
        try {
          const data = await fetchWithProxyFallback(endpoint);
          const prices = parseChartResponse(data);
          if (prices.length > 0) {
            console.log(`[YFinance] ✅ Fetched ${prices.length} candles for ${ticker} via proxy`);
            return prices;
          }
        } catch (e) {
          // Try next endpoint
          continue;
        }
      }
      throw new Error('All Yahoo Finance endpoints returned empty data');
    } catch (yError) {
      console.warn(`[YFinance] Yahoo Finance failed for ${ticker}:`, yError);

      // Fallback: Alpha Vantage (for Indian stocks: ticker without .NS/.BO suffix)
      try {
        const avTicker = ticker.replace(/\.(NS|BO|BSE|NSE)$/i, '');
        const avData = await getAlphaVantageDaily(avTicker);
        if (avData && avData.length > 0) {
          console.log(`[YFinance] 🔄 Used Alpha Vantage fallback for ${ticker}`);
          return avData.map((d: any) => ({
            date: d.date,
            close: d.close,
            open: d.open,
            high: d.high,
            low: d.low,
            volume: d.volume,
          }));
        }
      } catch (avError) {
        console.warn(`[YFinance] Alpha Vantage fallback also failed:`, avError);
      }

      return [];
    }
  },

  /**
   * Get the latest price for a ticker (last close).
   */
  getLatestPrice: async (ticker: string): Promise<number | null> => {
    try {
      const data = await yahooFinance.getHistoricalData(ticker, '1mo', '1d');
      if (data.length === 0) return null;
      return data[data.length - 1].close;
    } catch {
      return null;
    }
  },
};
