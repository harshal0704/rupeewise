/**
 * Alpha Vantage Service — Historical stock data for Indian (BSE) & global markets
 * Free tier: 25 requests/day, 5 requests/minute
 * 
 * Indian stocks use BSE:SYMBOL format (e.g., BSE:RELIANCE, BSE:TCS, BSE:INFY)
 * US stocks use plain symbol (e.g., AAPL, MSFT)
 */

const getAlphaVantageKey = (): string => {
    return localStorage.getItem('alphavantage_api_key') || import.meta.env.VITE_ALPHAVANTAGE_API_KEY || '';
};

const BASE_URL = 'https://www.alphavantage.co/query';

export interface AlphaVantageDaily {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

/**
 * Fetch daily historical prices from Alpha Vantage
 * @param symbol e.g., "BSE:RELIANCE" for Indian, or "AAPL" for US
 * @param outputsize "compact" (latest 100) or "full" (20+ years, premium)
 */
export const getAlphaVantageDaily = async (
    symbol: string,
    outputsize: 'compact' | 'full' = 'compact'
): Promise<AlphaVantageDaily[]> => {
    const apiKey = getAlphaVantageKey();
    if (!apiKey) {
        console.warn('Alpha Vantage API key not set');
        return [];
    }

    try {
        const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=${outputsize}&apikey=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) return [];

        const data = await response.json();

        // Check for API errors
        if (data['Error Message'] || data['Note'] || data['Information']) {
            console.warn('Alpha Vantage API:', data['Error Message'] || data['Note'] || data['Information']);
            return [];
        }

        const timeSeries = data['Time Series (Daily)'];
        if (!timeSeries) return [];

        // Convert to array sorted by date ascending
        const result: AlphaVantageDaily[] = Object.entries(timeSeries)
            .map(([date, values]: [string, any]) => ({
                date,
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseInt(values['5. volume'], 10),
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return result;
    } catch (error) {
        console.error('Alpha Vantage Error:', error);
        return [];
    }
};

/**
 * Search for stock symbols via Alpha Vantage
 */
export const searchAlphaVantageSymbol = async (query: string): Promise<any[]> => {
    const apiKey = getAlphaVantageKey();
    if (!apiKey) return [];

    try {
        const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) return [];

        const data = await response.json();
        return data.bestMatches || [];
    } catch (error) {
        console.error('Alpha Vantage Search Error:', error);
        return [];
    }
};

/**
 * Popular Indian BSE symbols for quick reference
 */
export const POPULAR_INDIAN_STOCKS = [
    { symbol: 'BSE:RELIANCE', name: 'Reliance Industries' },
    { symbol: 'BSE:TCS', name: 'Tata Consultancy Services' },
    { symbol: 'BSE:INFY', name: 'Infosys' },
    { symbol: 'BSE:HDFCBANK', name: 'HDFC Bank' },
    { symbol: 'BSE:ICICIBANK', name: 'ICICI Bank' },
    { symbol: 'BSE:HINDUNILVR', name: 'Hindustan Unilever' },
    { symbol: 'BSE:SBIN', name: 'State Bank of India' },
    { symbol: 'BSE:BHARTIARTL', name: 'Bharti Airtel' },
    { symbol: 'BSE:ITC', name: 'ITC Limited' },
    { symbol: 'BSE:KOTAKBANK', name: 'Kotak Mahindra Bank' },
    { symbol: 'BSE:WIPRO', name: 'Wipro' },
    { symbol: 'BSE:TATAMOTORS', name: 'Tata Motors' },
    { symbol: 'BSE:MARUTI', name: 'Maruti Suzuki' },
    { symbol: 'BSE:BAJFINANCE', name: 'Bajaj Finance' },
    { symbol: 'BSE:ADANIENT', name: 'Adani Enterprises' },
];
