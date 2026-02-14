import { GoogleGenAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenAI(apiKey);

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
    getScreenerUrl: (symbol: string) => `https://www.screener.in/company/${symbol}/`,

    analyzeStock: async (symbol: string): Promise<ScreenerData> => {
        const screenerUrl = `https://www.screener.in/company/${symbol}/`;

        if (!apiKey) {
            return {
                symbol,
                screenerUrl,
                pros: ["API Key Missing"],
                cons: ["Cannot generate insights"],
                ratios: [],
                summary: "Please add your Gemini API Key to enable AI insights."
            };
        }

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `
                Analyze the Indian stock "${symbol}" as if you are the website Screener.in.
                Provide the following in JSON format ONLY:
                1. "pros": A list of 3 key strengths (e.g., "Company is virtually debt free").
                2. "cons": A list of 3 key weaknesses (e.g., "Stock is trading at 5x book value").
                3. "ratios": A list of 4 key financial ratios with estimated values (Market Cap, P/E, ROCE, ROE).
                4. "summary": A 1-sentence summary of the business.
                
                Ensure the tone is analytical and factual.
            `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            // Clean up code blocks if present
            const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanText);

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
