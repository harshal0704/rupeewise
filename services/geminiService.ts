import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from "../types";

const getApiKey = () => localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
const getGeminiModel = () => localStorage.getItem('gemini_model') || 'gemini-2.0-flash-lite-preview-02-05';

const INDIAN_FINANCE_SYSTEM_INSTRUCTION = `
You are RupeeWise AI, a financial expert tailored for the Indian market. 
You understand UPI, Indian Income Tax (Old vs New Regime), Mutual Funds (SIP, Lumpsum), Stocks (NSE/BSE), and economic trends in India.
Your tone is encouraging, clear, and financially prudent.
Always use Indian numbering formatting (Lakhs, Crores) where appropriate in text, but keep numbers standard in JSON.
Currency symbol: ₹.
`;

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const categorizeTransaction = async (description: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Uncategorized";

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: `Categorize this Indian UPI/Bank transaction description into one word (e.g., Food, Travel, Utility, Shopping, Health, Entertainment, Transfer): "${description}"`,
      config: {
        systemInstruction: "You are a transaction classifier. Return ONLY the category name.",
        temperature: 0.1,
      }
    });
    return response.text?.trim() || "Uncategorized";
  } catch (error) {
    console.error("Gemini Categorization Error:", error);
    return "Uncategorized";
  }
};

export const parseBankStatement = async (file: File): Promise<Transaction[]> => {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });

  try {
    const filePart = await fileToGenerativePart(file);

    const prompt = `
      Extract transactions from this bank statement image/PDF.
      Return a JSON array where each object has:
      - date (string, YYYY-MM-DD)
      - merchant (string, clean up the name)
      - amount (number)
      - type (string, 'debit' or 'credit')
      - category (string, infer based on merchant)
      
      Ignore opening/closing balances. Focus on transaction rows.
    `;

    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: {
        parts: [
          filePart,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              merchant: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              type: { type: Type.STRING, enum: ["debit", "credit"] },
              category: { type: Type.STRING }
            }
          }
        }
      }
    });

    const rawData = JSON.parse(response.text || "[]");

    // Transform to App Transaction type
    return rawData.map((t: any, index: number) => ({
      id: `${Date.now()}-${index}`,
      date: t.date,
      merchant: t.merchant,
      amount: t.amount,
      category: t.category,
      type: t.type,
      paymentMethod: 'UPI' // Default assumption for imported stats
    }));

  } catch (error) {
    console.error("Statement Parse Error:", error);
    return [];
  }
};

export const getFinancialAdvice = async (history: { role: string, parts: { text: string }[] }[]): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Please configure your API Key to chat with RupeeWise AI.";

  const ai = new GoogleGenAI({ apiKey });

  try {
    const chat = ai.chats.create({
      model: getGeminiModel(),
      config: {
        systemInstruction: INDIAN_FINANCE_SYSTEM_INSTRUCTION,
      },
      history: history
    });

    const lastMsg = history[history.length - 1].parts[0].text;
    const result = await chat.sendMessage({ message: lastMsg });
    return result.text || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Sorry, I'm having trouble connecting to the financial network right now.";
  }
};

export const explainTaxLiablity = async (income: number, deductions: number, regime: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "API Key missing.";

  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `
      Calculate and explain the income tax liability for an Indian individual with:
      Gross Annual Income: ₹${income}
      Total Deductions (80C, etc.): ₹${deductions}
      Chosen Regime: ${regime}
      
      Provide a breakdown of the tax slabs applicable and the final tax payable (including cess). 
      Also, briefly mention if the other regime would have been better.
      Keep it simple and concise.
    `;

    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        systemInstruction: INDIAN_FINANCE_SYSTEM_INSTRUCTION,
      }
    });
    return response.text || "Could not calculate tax.";
  } catch (error) {
    console.error("Gemini Tax Error:", error);
    return "Error calculating tax explanation.";
  }
};

export const simulateLifeScenario = async (prompt: string): Promise<{ analysis: string, feasible: boolean }> => {
  const apiKey = getApiKey();
  if (!apiKey) return { analysis: "API Key missing.", feasible: false };

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        systemInstruction: INDIAN_FINANCE_SYSTEM_INSTRUCTION + " Analyze the user's financial scenario. Return a JSON object with 'analysis' (string, markdown supported) and 'feasible' (boolean).",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            feasible: { type: Type.BOOLEAN }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Simulation Error:", error);
    return { analysis: "Failed to simulate scenario.", feasible: false };
  }
};

export const getMarketStatus = async (): Promise<{ text: string, sources: string[] }> => {
  const apiKey = getApiKey();
  if (!apiKey) return { text: "API Key missing", sources: [] };

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: "What is the live/current value of Nifty 50 and Sensex? concise one line.",
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    // Extract grounding sources if available
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((c: any) => c.web?.uri)
      .filter((u: string) => u) || [];

    return {
      text: response.text?.trim() || "Market data unavailable",
      sources
    };
  } catch (error) {
    console.error("Market Data Error:", error);
    return { text: "Market data unavailable", sources: [] };
  }
};

export const runStockSimulation = async (stock: string, strategy: string, duration: string): Promise<any> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Simulate an investment strategy for Indian Stock Market based on historical trends or realistic volatility.
  Stock/Index: ${stock}
  Strategy: ${strategy} (e.g., SIP, Buy on Dip, Lumpsum)
  Duration: ${duration}
  
  Generate a JSON response with:
  1. "chartData": Array of objects representing the timeline. Each object must have:
     - "label" (string, e.g. "Month 1" or date)
     - "invested" (number, cumulative invested amount)
     - "value" (number, simulated portfolio value)
     Generate about 12 data points to show the trend.
  2. "analysis": A detailed markdown string explaining why this strategy worked or failed for this stock, mentioning historical volatility, sector performance, or trends of ${stock}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chartData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  invested: { type: Type.NUMBER },
                  value: { type: Type.NUMBER }
                }
              }
            },
            analysis: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Stock Sim Error:", error);
    return null;
  }
};

export const screenStocks = async (query: string): Promise<any> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: `You are a professional stock screener for the Indian Market (NSE/BSE).
      User Query: "${query}"
      
      Use Google Search to find current data (P/E, Market Cap, Recent News) matching the criteria.
      
      Return a JSON object with:
      1. "results": Array of MAX 5 stock objects. Each object: { symbol, name, price (string), reasoning (concise string) }
      2. "summary": A brief market outlook (string).
      
      IMPORTANT: Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json.
      `,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  symbol: { type: Type.STRING },
                  name: { type: Type.STRING },
                  price: { type: Type.STRING },
                  reasoning: { type: Type.STRING }
                }
              }
            },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    // Robust JSON parsing
    let cleanText = response.text || "{}";
    // Remove markdown code blocks if they exist
    cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();

    // Sometimes models add explanatory text before/after JSON even with responseSchema
    const jsonStart = cleanText.indexOf('{');
    const jsonEnd = cleanText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
    }

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Screener Error:", error);
    return {
      results: [],
      summary: "We encountered an error processing the market data. Please try a more specific query."
    };
  }
};

export const getHistoricalComparison = async (stocks: string[]): Promise<any> => {
  const apiKey = getApiKey();
  if (!apiKey) return { chartData: [] };

  const ai = new GoogleGenAI({ apiKey });

  const stocksStr = stocks.join(", ");
  const prompt = `
    Compare the historical performance of these Indian stocks/indices over the last 1 year: ${stocksStr}.
    Generate normalized performance data (starting at 100) for monthly intervals.
    
    Return JSON:
    "chartData": Array of objects. Each object represents a month (e.g., "Jan", "Feb").
    It must have "month" key, and keys for each stock symbol with their normalized value.
    Example: [{"month": "Jan", "Reliance": 100, "TCS": 100}, {"month": "Feb", "Reliance": 105, "TCS": 98}...]
  `;

  try {
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chartData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                additionalProperties: true
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Comparison Error:", error);
    return { chartData: [] };
  }
};

export const getStockPrice = async (symbol: string): Promise<{ price: number, name: string }> => {
  const apiKey = getApiKey();
  if (!apiKey) return { price: 0, name: symbol };

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: `What is the approximate current share price of ${symbol} in NSE India? Return ONLY a JSON object: {"price": number, "name": "Full Company Name"}.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });
    const data = JSON.parse(response.text || "{}");
    return { price: data.price || 0, name: data.name || symbol };
  } catch (error) {
    console.error("Price Fetch Error:", error);
    return { price: 0, name: symbol };
  }
};

export const analyzePortfolio = async (holdings: any[]) => {
  const apiKey = getApiKey();
  if (!apiKey) return "API Key missing.";

  try {
    const prompt = `
      Analyze the following investment portfolio and provide a brief assessment of its diversification, risk level, and suggestions for improvement.
      
      Portfolio Holdings:
      ${JSON.stringify(holdings, null, 2)}
      
      Output format:
      1. **Assessment**: [Brief summary]
      2. **Risk Profile**: [Low/Medium/High]
      3. **Suggestions**: [Bulleted list of 2-3 actionable tips]
      
      Keep the tone professional yet easy to understand for an Indian investor.
    `;

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        systemInstruction: INDIAN_FINANCE_SYSTEM_INSTRUCTION
      }
    });

    return response.text?.trim() || "Unable to generate analysis.";
  } catch (error) {
    console.error("Gemini Portfolio Analysis Error:", error);
    return "Unable to generate portfolio analysis at this time. Please try again later.";
  }
};

export const generateFullCourse = async (topic: string): Promise<any> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `
      Create a comprehensive, short financial course about: "${topic}".
      Target audience: Indian beginner investors.
      
      Return a JSON object with:
      1. "title": Engaging course title.
      2. "description": Brief overview (1 sentence).
      3. "icon": suggest a Lucide icon (e.g., "TrendingUp", "Bitcoin", "DollarSign", "Globe", "Zap").
      4. "color": suggest a Tailwind text color class (e.g., "text-blue-400").
      5. "bg": suggest a Tailwind bg color class (e.g., "bg-blue-500/10").
      6. "lessons": Array of exactly 3 lessons. Each lesson must have:
         - "title": Lesson title.
         - "duration": e.g. "5 min".
         - "content": A detailed Markdown string. It should explain the concept clearly with examples, pros/cons, and a summary. Use bolding and lists. Format it nicely for reading.
      
      Ensure the content is high quality and educational.
    `;

    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            icon: { type: Type.STRING },
            color: { type: Type.STRING },
            bg: { type: Type.STRING },
            lessons: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  content: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "null");
  } catch (error) {
    console.error("Course Generation Error:", error);
    return null;
  }
};
