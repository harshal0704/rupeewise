import { finnhub } from './finnhub';

const API_TOKEN = import.meta.env.VITE_EODHD_API_TOKEN || 'demo';

export interface EODHDNewsItem {
    date: string;
    title: string;
    content: string;
    link: string;
    symbols: string[];
    tags: string[];
}

// CORS Proxy helper
const fetchWithProxy = async (url: string) => {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
        const response = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
        return await response.json();
    } catch (e) {
        clearTimeout(timeout);
        throw e;
    }
};

export const eodhdService = {
    getMarketNews: async (limit: number = 10): Promise<EODHDNewsItem[]> => {
        try {
            const url = `https://eodhd.com/api/news?api_token=${API_TOKEN}&s=NSE.INDX&limit=${limit}&offset=0`;
            const data = await fetchWithProxy(url);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("EODHD News Error:", error);
            return [];
        }
    },

    searchStock: async (query: string) => {
        try {
            const url = `https://eodhd.com/api/search/${query}?api_token=${API_TOKEN}&limit=5&exchange=NSE`;
            const data = await fetchWithProxy(url);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("EODHD Search Error:", error);
            return [];
        }
    },

    getLivePrice: async (symbol: string) => {
        // Strategy: Try Finnhub first (reliable, no CORS), then EODHD as fallback
        try {
            // Clean symbol for Finnhub (remove .NSE, .NS, .BO suffixes)
            const finnhubSymbol = symbol.replace(/\.(NSE|NS|BO|BSE)$/i, '');
            const quote = await finnhub.getQuote(finnhubSymbol);
            
            if (quote && quote.c > 0) {
                return {
                    price: quote.c,
                    change: quote.d || 0,
                    change_p: quote.dp || 0
                };
            }
        } catch (error) {
            console.warn("Finnhub price failed for:", symbol, error);
        }

        // Fallback: Try EODHD
        try {
            const ticker = symbol.includes('.') ? symbol : `${symbol}.NSE`;
            const url = `https://eodhd.com/api/real-time/${ticker}?api_token=${API_TOKEN}&fmt=json`;
            const data = await fetchWithProxy(url);
            
            if (data && (data.close || data.previousClose)) {
                return {
                    price: data.close || data.previousClose || 0,
                    change: data.change || 0,
                    change_p: data.change_p || 0
                };
            }
        } catch (error) {
            console.warn("EODHD fallback also failed for:", symbol);
        }

        return { price: 0, change: 0, change_p: 0 };
    },

    getHistoricalData: async (symbol: string, period: 'd' | 'w' | 'm' = 'd', fromDate?: string, toDate?: string) => {
        try {
            const ticker = symbol.includes('.') ? symbol : `${symbol}.NSE`;
            let url = `https://eodhd.com/api/eod/${ticker}?api_token=${API_TOKEN}&period=${period}&fmt=json`;
            if (fromDate) url += `&from=${fromDate}`;
            if (toDate) url += `&to=${toDate}`;

            const data = await fetchWithProxy(url);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("EODHD Historical Error:", error);
            return [];
        }
    }
};
