import { format, subDays } from 'date-fns';

const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || 'cpt0031r01qi49k7c800cpt0031r01qi49k7c80g'; // Fallback free key or user's key

export interface NewsItem {
    category: string;
    datetime: number;
    headline: string;
    id: number;
    image: string;
    related: string;
    source: string;
    summary: string;
    url: string;
}

export const finnhub = {
    /**
     * Fetch company specific news
     * @param symbol Stock symbol (e.g., AAPL, RELIANCE.NS)
     */
    getCompanyNews: async (symbol: string): Promise<NewsItem[]> => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const lastWeek = format(subDays(new Date(), 7), 'yyyy-MM-dd');

            // Finnhub requires distinct 'from' and 'to' params
            const response = await fetch(
                `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${lastWeek}&to=${today}&token=${API_KEY}`
            );

            if (!response.ok) throw new Error('Failed to fetch company news');
            return await response.json();
        } catch (error) {
            console.error("Finnhub Error:", error);
            return [];
        }
    },

    /**
     * Fetch general market news
     * @param category 'general', 'forex', 'crypto', 'merger'
     */
    getMarketNews: async (category: string = 'general'): Promise<NewsItem[]> => {
        try {
            const response = await fetch(
                `https://finnhub.io/api/v1/news?category=${category}&token=${API_KEY}`
            );

            if (!response.ok) throw new Error('Failed to fetch market news');
            return await response.json();
        } catch (error) {
            console.error("Finnhub Error:", error);
            return [];
        }
    },

    /**
     * Fetch real-time quote
     * @param symbol Stock symbol
     */
    getQuote: async (symbol: string): Promise<{ c: number, d: number, dp: number } | null> => {
        try {
            const response = await fetch(
                `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`
            );

            if (!response.ok) {
                console.warn(`Finnhub quote returned non-ok status for ${symbol}`);
                return null;
            }
            const data = await response.json();
            // Finnhub sometimes returns empty object or {c: 0, d: null, dp: null} for unsupported tickers
            if (!data || (data.c === 0 && data.d === null)) {
                return null;
            }
            return data;
        } catch (error) {
            console.error("Finnhub Quote Error:", error);
            return null;
        }
    },

    /**
     * Search for a company symbol
     * @param query Company name or symbol prefix
     */
    /**
     * Fetch historical stock candles (OHLCV)
     * @param symbol Stock symbol (e.g., AAPL, MSFT)
     * @param resolution Candle resolution: 1, 5, 15, 30, 60, D, W, M
     * @param from Unix timestamp start
     * @param to Unix timestamp end
     */
    getStockCandles: async (symbol: string, resolution: string = 'D', from: number, to: number): Promise<{ c: number[], h: number[], l: number[], o: number[], v: number[], t: number[], s: string } | null> => {
        try {
            const response = await fetch(
                `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${API_KEY}`
            );
            if (!response.ok) return null;
            const data = await response.json();
            if (data.s === 'no_data') return null;
            return data;
        } catch (error) {
            console.error("Finnhub Candle Error:", error);
            return null;
        }
    },

    searchSymbol: async (query: string): Promise<any[]> => {
        try {
            const response = await fetch(
                `https://finnhub.io/api/v1/search?q=${query}&token=${API_KEY}`
            );
            if (!response.ok) throw new Error('Failed to search symbol');
            const data = await response.json();
            return data.result || [];
        } catch (error) {
            console.error("Finnhub Search Error:", error);
            return [];
        }
    }
};
