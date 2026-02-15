const API_TOKEN = import.meta.env.VITE_EODHD_API_TOKEN || 'demo'; // Fallback to demo if not set for testing

export interface EODHDNewsItem {
    date: string;
    title: string;
    content: string;
    link: string;
    symbols: string[];
    tags: string[];
}

export const eodhdService = {
    getMarketNews: async (limit: number = 10): Promise<EODHDNewsItem[]> => {
        try {
            // EODHD Financial News API
            // usage: https://eodhd.com/api/news?api_token=YOUR_API_TOKEN&s=IN.general&limit=5
            // Using 'IN.general' for India market news or specific tickers
            const response = await fetch(`https://eodhd.com/api/news?api_token=${API_TOKEN}&s=NSE.INDX&limit=${limit}&offset=0`);
            const data = await response.json();

            if (Array.isArray(data)) {
                return data;
            }
            return [];
        } catch (error) {
            console.error("EODHD News Error:", error);
            // Fallback mock data if API fails or limit reached
            return [
                {
                    date: new Date().toISOString(),
                    title: "Market hits all-time high amidst positive global cues",
                    content: "The Nifty 50 index surged past significant resistance levels today...",
                    link: "#",
                    symbols: ["NSE"],
                    tags: ["Market"]
                }
            ];
        }
    },

    searchStock: async (query: string) => {
        try {
            const response = await fetch(`https://eodhd.com/api/search/${query}?api_token=${API_TOKEN}&limit=5&exchange=NSE`);
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("EODHD Search Error:", error);
            return [];
        }
    },

    getLivePrice: async (symbol: string) => {
        try {
            // Check if symbol has extension, default to .NSE if not
            const ticker = symbol.includes('.') ? symbol : `${symbol}.NSE`;
            const response = await fetch(`https://eodhd.com/api/real-time/${ticker}?api_token=${API_TOKEN}&fmt=json`);
            const data = await response.json();
            return {
                price: data.close || data.previousClose || 0,
                change: data.change || 0,
                change_p: data.change_p || 0
            };
        } catch (error) {
            console.error("EODHD Price Error:", error);
            return { price: 0, change: 0, change_p: 0 };
        }
    }
};
