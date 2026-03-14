import { AlphaVantageDaily, getAlphaVantageDaily } from './alphaVantage';

/**
 * Enhanced Yahoo Finance Service (Web-compatible)
 * Since there's no official client-side SDK for YF, we use a robust proxy approach
 * or fallback to our existing high-quality data providers with YF-style normalization.
 */

export interface HistoricalPrice {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

const CORS_PROXY = 'https://corsproxy.io/?';

export const yahooFinance = {
  /**
   * Fetch historical data with YFinance-style tickers (e.g. RELIANCE.NS, AAPL)
   */
  getHistoricalData: async (ticker: string, period: '1mo' | '1y' | '5y' | 'max' = '1y'): Promise<HistoricalPrice[]> => {
    try {
      return await yahooFinance.fetchFromProxy(ticker, period);
    } catch (error) {
      console.error("YFinance Error:", error);
      return [];
    }
  },

  /**
   * Direct fetch from a Yahoo Finance Query Proxy (CorsProxy.io)
   */
  fetchFromProxy: async (ticker: string, period: '1mo' | '1y' | '5y' | 'max'): Promise<HistoricalPrice[]> => {
    try {
      const now = Math.floor(Date.now() / 1000);
      let start = now - (365 * 24 * 60 * 60); 
      if (period === '1mo') start = now - (30 * 24 * 60 * 60);
      if (period === '5y') start = now - (5 * 365 * 24 * 60 * 60);
      if (period === 'max') start = 0;

      const url = `https://query1.finance.yahoo.com/v7/finance/chart/${ticker}?period1=${start}&period2=${now}&interval=1d&events=history`;
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
      
      if (!response.ok) throw new Error("Yahoo Finance Proxy failed");
      
      const chartData = await response.json();
      const chart = chartData.chart.result[0];
      
      const timestamps = chart.timestamp;
      const quotes = chart.indicators.quote[0];
      const adjClose = chart.indicators.adjclose?.[0]?.adjclose || quotes.close;
      
      if (!timestamps) return [];

      return timestamps.map((t: number, i: number) => ({
        date: new Date(t * 1000).toISOString().split('T')[0],
        close: adjClose[i] || quotes.close[i],
        open: quotes.open[i],
        high: quotes.high[i],
        low: quotes.low[i],
        volume: quotes.volume[i]
      })).filter((d: any) => d.close !== null);
    } catch (e) {
      console.error("Proxy Fetch Error:", e);
      return [];
    }
  }
};
