import { analyzeStockFundamentals } from "./geminiService";

export interface ScreenerData {
    symbol: string;
    screenerUrl: string;
    pros: string[];
    cons: string[];
    ratios: {
        label: string;
        value: string;
    }[];
    summary: string;
}

export const screenerService = {
    getScreenerUrl: (symbol: string) => {
        // Clean up symbol for screener.in
        const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
        return `https://www.screener.in/company/${cleanSymbol}/`;
    },

    analyzeStock: async (symbol: string): Promise<ScreenerData> => {
        const screenerUrl = screenerService.getScreenerUrl(symbol);

        try {
            const data = await analyzeStockFundamentals(symbol);

            if (!data) {
                return {
                    symbol,
                    screenerUrl,
                    pros: [],
                    cons: [],
                    ratios: [],
                    summary: "Please configure your AI API Key in Settings to enable insights."
                };
            }

            return {
                symbol,
                screenerUrl,
                pros: data.pros || [],
                cons: data.cons || [],
                ratios: data.ratios || [],
                summary: data.summary || ""
            };
        } catch (error) {
            console.error("Screener Analysis Error:", error);
            return {
                symbol,
                screenerUrl,
                pros: [],
                cons: [],
                ratios: [],
                summary: "Unable to generate insights at this moment."
            };
        }
    }
};
