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

            if (!response.ok) throw new Error('Failed to fetch quote');
            return await response.json();
        } catch (error) {
            console.error("Finnhub Quote Error:", error);
            return null;
        }
    }
};
