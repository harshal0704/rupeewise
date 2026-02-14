
export interface StockQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume?: number;
    date: string;
}

const API_KEY = import.meta.env.VITE_MARKETSTACK_API_KEY;
const BASE_URL = 'http://api.marketstack.com/v1';

export const marketstack = {
    /**
     * Fetch End-of-Day data for multiple symbols
     * Marketstack Free Tier only supports EOD, not real-time intraday.
     */
    getRealTimePrice: async (symbols: string[]): Promise<StockQuote[]> => {
        if (!API_KEY) {
            console.warn("Marketstack API Key missing");
            // Return mock data if no key (fallback)
            return symbols.map(s => ({
                symbol: s,
                price: Math.random() * 2000 + 100,
                change: Math.random() * 20 - 10,
                changePercent: Math.random() * 2 - 1,
                date: new Date().toISOString()
            }));
        }

        try {
            const symbolsParam = symbols.join(',');
            // Using EOD endpoint as it is usually available in free tiers more reliably than intraday
            const response = await fetch(`${BASE_URL}/eod/latest?access_key=${API_KEY}&symbols=${symbolsParam}`);
            const data = await response.json();

            if (data.error) {
                console.error("Marketstack API Error:", data.error);
                throw new Error(data.error.message);
            }

            return data.data.map((item: any) => ({
                symbol: item.symbol,
                price: item.close,
                change: item.close - item.open, // Approximation for EOD change
                changePercent: ((item.close - item.open) / item.open) * 100,
                volume: item.volume,
                date: item.date
            }));
        } catch (error) {
            console.error("Failed to fetch stock prices:", error);
            // Fallback to mock data on error to prevent UI crash
            return symbols.map(s => ({
                symbol: s,
                price: 0,
                change: 0,
                changePercent: 0,
                date: new Date().toISOString()
            }));
        }
    }
};
