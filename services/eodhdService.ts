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
    // Try without proxy first, fallback if it fails, or just use corsproxy.io
    // Using corsproxy.io as it's generally more reliable than allorigins
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
    return await response.json(); // corsproxy returns the raw response directly, unlike allorigins
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
            throw new Error("Invalid EODHD Data");
        } catch (error) {
            console.warn("EODHD Price Error, trying Yahoo Finance fallback for:", symbol);
            try {
                // Yahoo finance fallback via proxy
                const yfSymbol = symbol.includes('.') ? symbol.replace('.NSE', '.NS') : `${symbol}.NS`;
                const yfUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${yfSymbol}?interval=1d`;
                const yfData = await fetchWithProxy(yfUrl);
                
                if (yfData && yfData.chart && yfData.chart.result && yfData.chart.result.length > 0) {
                    const meta = yfData.chart.result[0].meta;
                    const price = meta.regularMarketPrice;
                    const prevClose = meta.chartPreviousClose;
                    const change = price - prevClose;
                    const change_p = prevClose ? (change / prevClose) * 100 : 0;
                    
                    return { price, change, change_p };
                }
            } catch (yfError) {
                console.error("Yahoo Finance Fallback Error:", yfError);
            }
            return { price: 0, change: 0, change_p: 0 };
        }
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
