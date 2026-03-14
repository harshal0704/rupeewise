import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from "../types";

// ═══════════════════════════════════════════════════
// AI PROVIDER ABSTRACTION — Groq + Gemini Dual Support
// ═══════════════════════════════════════════════════

type AIProvider = 'groq' | 'gemini';

// Removed hardcoded key for security

const getAIProvider = (): AIProvider =>
  (localStorage.getItem('ai_provider') as AIProvider) || 'groq';

const getGroqApiKey = (): string =>
  localStorage.getItem('groq_api_key') || import.meta.env.VITE_GROQ_API_KEY || '';

const getGeminiApiKey = (): string =>
  localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';

const getGeminiModel = (): string =>
  localStorage.getItem('gemini_model') || 'gemini-2.0-flash-lite-preview-02-05';

const getGroqModel = (): string =>
  localStorage.getItem('groq_model') || 'llama-3.3-70b-versatile';

const getGroqVisionModel = (): string => 'llama-3.2-90b-vision-preview';

const INDIAN_FINANCE_SYSTEM_INSTRUCTION = `
You are RupeeWise AI, a financial expert tailored for the Indian market. 
You understand UPI, Indian Income Tax (Old vs New Regime), Mutual Funds (SIP, Lumpsum), Stocks (NSE/BSE), and economic trends in India.
Your tone is encouraging, clear, and financially prudent.
Always use Indian numbering formatting (Lakhs, Crores) where appropriate in text, but keep numbers standard in JSON.
Currency symbol: ₹.
`;

// ─── Groq API Helper ───
const groqChat = async (
  messages: { role: string; content: string }[],
  options: { json?: boolean; model?: string; temperature?: number } = {}
): Promise<string> => {
  const apiKey = getGroqApiKey();
  const model = options.model || getGroqModel();

  const body: any = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: 4096,
  };

  if (options.json) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
};

// Groq vision helper for file parsing
const groqVision = async (
  base64Data: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  const apiKey = getGroqApiKey();
  const model = getGroqVisionModel();

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Data}` },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq Vision Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '{}';
};

// ─── Helper to convert file to base64 ───
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

// ═══════════════════════════════════════════════
// EXPORTED FUNCTIONS — Provider-aware
// ═══════════════════════════════════════════════

export const categorizeTransaction = async (description: string): Promise<string> => {
  const provider = getAIProvider();

  if (provider === 'groq') {
    try {
      const result = await groqChat([
        { role: 'system', content: 'You are a transaction classifier. Return ONLY the category name, nothing else.' },
        { role: 'user', content: `Categorize this Indian UPI/Bank transaction description into one word (e.g., Food, Travel, Utility, Shopping, Health, Entertainment, Transfer): "${description}"` },
      ], { temperature: 0.1 });
      return result.trim() || 'Uncategorized';
    } catch (error) {
      console.error("Groq Categorization Error:", error);
      return 'Uncategorized';
    }
  }

  // Gemini
  const apiKey = getGeminiApiKey();
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
  try {
    const provider = getAIProvider();
    const filePart = await fileToGenerativePart(file);

    const prompt = `
      Extract transactions from this bank statement image/PDF.
      Return a JSON object with a "transactions" key containing an array where each object has:
      - date (string, YYYY-MM-DD)
      - merchant (string, clean up the name)
      - amount (number)
      - type (string, 'debit' or 'credit')
      - category (string, infer based on merchant)
      
      Ignore opening/closing balances. Focus on transaction rows.
      Return ONLY valid JSON with the "transactions" key.
    `;

    if (provider === 'groq') {
      try {
        const result = await groqVision(filePart.inlineData.data, filePart.inlineData.mimeType, prompt);
        const parsed = JSON.parse(result || "{}");
        const rawData = parsed.transactions || (Array.isArray(parsed) ? parsed : []);
        
        if (!Array.isArray(rawData)) return [];
        
        return rawData.map((t: any, index: number) => ({
          id: `ext-${Date.now()}-${index}`,
          date: t.date || new Date().toISOString().split('T')[0],
          merchant: t.merchant || 'Unknown Merchant',
          amount: typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0,
          category: t.category || 'Other',
          type: t.type === 'credit' ? 'credit' : 'debit',
          paymentMethod: 'UPI'
        }));
      } catch (error) {
        console.error("Groq Statement Parse Error:", error);
        return [];
      }
    }

    // Gemini
    const apiKey = getGeminiApiKey();
    if (!apiKey) throw new Error("Gemini API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    
    try {
      const result = await ai.models.generateContent({
        model: getGeminiModel(),
        contents: {
          parts: [filePart, { text: prompt }]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transactions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    merchant: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    type: { type: Type.STRING, enum: ["debit", "credit"] },
                    category: { type: Type.STRING }
                  },
                  required: ["date", "merchant", "amount", "type"]
                }
              }
            },
            required: ["transactions"]
          }
        }
      });

      const responseText = result.text || "{}";
      const parsed = JSON.parse(responseText);
      const rawData = parsed.transactions || (Array.isArray(parsed) ? parsed : []);

      if (!Array.isArray(rawData)) return [];

      return rawData.map((t: any, index: number) => ({
        id: `ext-${Date.now()}-${index}`,
        date: t.date || new Date().toISOString().split('T')[0],
        merchant: t.merchant || 'Unknown Merchant',
        amount: typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0,
        category: t.category || 'Other',
        type: t.type === 'credit' ? 'credit' : 'debit',
        paymentMethod: 'UPI'
      }));
    } catch (error) {
      console.error("Gemini Statement Parse Error:", error);
      return [];
    }
  } catch (globalError) {
    console.error("Global Statement Parse Error:", globalError);
    return [];
  }
};

export const getFinancialAdvice = async (history: { role: string, parts: { text: string }[] }[]): Promise<string> => {
  const provider = getAIProvider();

  if (provider === 'groq') {
    try {
      const messages = [
        { role: 'system', content: INDIAN_FINANCE_SYSTEM_INSTRUCTION },
        ...history.map(h => ({
          role: h.role === 'model' ? 'assistant' : 'user',
          content: h.parts[0].text,
        })),
      ];
      return await groqChat(messages);
    } catch (error) {
      console.error("Groq Chat Error:", error);
      return "Sorry, I'm having trouble connecting right now.";
    }
  }

  // Gemini
  const apiKey = getGeminiApiKey();
  if (!apiKey) return "Please configure your API Key to chat with RupeeWise AI.";
  const ai = new GoogleGenAI({ apiKey });
  try {
    const chat = ai.chats.create({
      model: getGeminiModel(),
      config: { systemInstruction: INDIAN_FINANCE_SYSTEM_INSTRUCTION },
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
  const provider = getAIProvider();
  const prompt = `
    Calculate and explain the income tax liability for an Indian individual with:
    Gross Annual Income: ₹${income}
    Total Deductions (80C, etc.): ₹${deductions}
    Chosen Regime: ${regime}
    
    Provide a breakdown of the tax slabs applicable and the final tax payable (including cess). 
    Also, briefly mention if the other regime would have been better.
    Keep it simple and concise.
  `;

  if (provider === 'groq') {
    try {
      return await groqChat([
        { role: 'system', content: INDIAN_FINANCE_SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt },
      ]);
    } catch (error) {
      console.error("Groq Tax Error:", error);
      return "Error calculating tax explanation.";
    }
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) return "API Key missing.";
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: { systemInstruction: INDIAN_FINANCE_SYSTEM_INSTRUCTION }
    });
    return response.text || "Could not calculate tax.";
  } catch (error) {
    console.error("Gemini Tax Error:", error);
    return "Error calculating tax explanation.";
  }
};

export const simulateLifeScenario = async (prompt: string): Promise<{ analysis: string, feasible: boolean }> => {
  const provider = getAIProvider();

  if (provider === 'groq') {
    try {
      const result = await groqChat([
        { role: 'system', content: INDIAN_FINANCE_SYSTEM_INSTRUCTION + " Analyze the user's financial scenario. Return a JSON object with 'analysis' (string, markdown supported) and 'feasible' (boolean)." },
        { role: 'user', content: prompt },
      ], { json: true });
      return JSON.parse(result);
    } catch (error) {
      console.error("Groq Simulation Error:", error);
      return { analysis: "Failed to simulate scenario.", feasible: false };
    }
  }

  const apiKey = getGeminiApiKey();
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
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Simulation Error:", error);
    return { analysis: "Failed to simulate scenario.", feasible: false };
  }
};

export const getMarketStatus = async (): Promise<{ text: string, sources: string[] }> => {
  const provider = getAIProvider();

  if (provider === 'groq') {
    try {
      const result = await groqChat([
        { role: 'system', content: 'You are a financial market expert. Give concise market updates.' },
        { role: 'user', content: 'What is the approximate current value of Nifty 50 and Sensex? Concise one line answer.' },
      ], { temperature: 0.3 });
      return { text: result.trim(), sources: [] };
    } catch (error) {
      console.error("Groq Market Error:", error);
      return { text: "Market data unavailable", sources: [] };
    }
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) return { text: "API Key missing", sources: [] };
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: "What is the live/current value of Nifty 50 and Sensex? concise one line.",
      config: { tools: [{ googleSearch: {} }] }
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((c: any) => c.web?.uri).filter((u: string) => u) || [];
    return { text: response.text?.trim() || "Market data unavailable", sources };
  } catch (error) {
    console.error("Market Data Error:", error);
    return { text: "Market data unavailable", sources: [] };
  }
};

export const runStockSimulation = async (stock: string, strategy: string, duration: string): Promise<any> => {
  const provider = getAIProvider();
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
  2. "analysis": A detailed markdown string explaining why this strategy worked or failed for this stock.
  
  Return ONLY valid JSON.`;

  if (provider === 'groq') {
    try {
      const result = await groqChat([
        { role: 'system', content: INDIAN_FINANCE_SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt },
      ], { json: true });
      return JSON.parse(result);
    } catch (error) {
      console.error("Groq Stock Sim Error:", error);
      return null;
    }
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
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

export const analyzeBacktestResults = async (stock: string, strategy: string, metrics: any): Promise<string> => {
  const provider = getAIProvider();
  const prompt = `You are a quantitative financial analyst. Review these REAL mathematical backtest results for ${stock} using strategy: ${strategy}.
  
  Metrics:
  - Initial Investment: ₹1,00,000
  - Final Value: ₹${metrics.finalValue}
  - CAGR: ${metrics.cagr}%
  - Max Drawdown: ${metrics.maxDrawdown}%
  - Sharpe Ratio (Estimate): ${metrics.sharpe}

  Write a concise, professional review of this strategy's performance on this asset. Use Markdown formatting (bolding, lists) to highlight key risk/reward takeaways. Do not use JSON. Assume the numbers are 100% mathematically accurate.`;

  if (provider === 'groq') {
    try {
      return await groqChat([
        { role: 'system', content: INDIAN_FINANCE_SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt },
      ]);
    } catch (error) {
      console.error("Groq Analysis Error:", error);
      return "Error generating analysis.";
    }
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) return "API Key missing.";
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: { systemInstruction: INDIAN_FINANCE_SYSTEM_INSTRUCTION }
    });
    return response.text || "Failed to generate analysis.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Error generating analysis.";
  }
};

export const screenStocks = async (query: string): Promise<any> => {
  const provider = getAIProvider();
  const prompt = `You are a professional stock screener for the Indian Market (NSE/BSE).
  User Query: "${query}"
  
  Find stocks matching the criteria based on your knowledge.
  
  Return a JSON object with:
  1. "results": Array of MAX 5 stock objects. Each object: { "symbol": string, "name": string, "price": string, "reasoning": string }
  2. "summary": A brief market outlook (string).
  
  Return ONLY valid JSON.`;

  if (provider === 'groq') {
    try {
      const result = await groqChat([
        { role: 'system', content: INDIAN_FINANCE_SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt },
      ], { json: true });
      return JSON.parse(result);
    } catch (error) {
      console.error("Groq Screener Error:", error);
      return { results: [], summary: "Error processing. Try again." };
    }
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
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
    let cleanText = response.text || "{}";
    cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonStart = cleanText.indexOf('{');
    const jsonEnd = cleanText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Screener Error:", error);
    return { results: [], summary: "Error processing the market data." };
  }
};

export const getHistoricalComparison = async (stocks: string[]): Promise<any> => {
  const provider = getAIProvider();
  const stocksStr = stocks.join(", ");
  const prompt = `
    Compare the historical performance of these Indian stocks/indices over the last 1 year: ${stocksStr}.
    Generate normalized performance data (starting at 100) for monthly intervals.
    
    Return JSON with:
    "chartData": Array of objects. Each object represents a month (e.g., "Jan", "Feb").
    It must have "month" key, and keys for each stock symbol with their normalized value.
    
    Return ONLY valid JSON.
  `;

  if (provider === 'groq') {
    try {
      const result = await groqChat([
        { role: 'system', content: INDIAN_FINANCE_SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt },
      ], { json: true });
      return JSON.parse(result);
    } catch (error) {
      console.error("Groq Comparison Error:", error);
      return { chartData: [] };
    }
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) return { chartData: [] };
  const ai = new GoogleGenAI({ apiKey });
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
              items: { type: Type.OBJECT, additionalProperties: true }
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
  const provider = getAIProvider();

  if (provider === 'groq') {
    try {
      const result = await groqChat([
        { role: 'system', content: 'You are a financial data assistant. Return ONLY valid JSON.' },
        { role: 'user', content: `What is the approximate current share price of ${symbol} in NSE India? Return ONLY a JSON object: {"price": number, "name": "Full Company Name"}.` },
      ], { json: true, temperature: 0.3 });
      const data = JSON.parse(result);
      return { price: data.price || 0, name: data.name || symbol };
    } catch (error) {
      console.error("Groq Price Error:", error);
      return { price: 0, name: symbol };
    }
  }

  const apiKey = getGeminiApiKey();
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
  const provider = getAIProvider();
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

  if (provider === 'groq') {
    try {
      return await groqChat([
        { role: 'system', content: INDIAN_FINANCE_SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt },
      ]);
    } catch (error) {
      console.error("Groq Portfolio Error:", error);
      return "Unable to generate portfolio analysis at this time.";
    }
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) return "API Key missing.";
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: { systemInstruction: INDIAN_FINANCE_SYSTEM_INSTRUCTION }
    });
    return response.text?.trim() || "Unable to generate analysis.";
  } catch (error) {
    console.error("Gemini Portfolio Error:", error);
    return "Unable to generate portfolio analysis at this time.";
  }
};

export const analyzeStockFundamentals = async (symbol: string): Promise<any> => {
  const provider = getAIProvider();
  const prompt = `
    Analyze the Indian stock "${symbol}" as if you are the website Screener.in.
    Provide the following in JSON format ONLY:
    1. "pros": A list of 3 key strengths (e.g., "Company is virtually debt free").
    2. "cons": A list of 3 key weaknesses (e.g., "Stock is trading at 5x book value").
    3. "ratios": A list of 6 key financial ratios with their EXACT labels and current estimated values.
       Include: Market Cap, P/E Ratio, ROCE %, ROE %, Dividend Yield, and Debt to Equity.
    4. "summary": A 1-2 sentence powerful executive summary of the business and its market position.
    
    Ensure the tone is professional, analytical, and factual.
  `;

  if (provider === 'groq') {
    try {
      const result = await groqChat([
        { role: 'system', content: INDIAN_FINANCE_SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt },
      ], { json: true });
      return JSON.parse(result);
    } catch (error) {
      console.error("Groq Stock Analysis Error:", error);
      return null;
    }
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } },
            ratios: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING }
                }
              }
            },
            summary: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Stock Analysis Error:", error);
    return null;
  }
};

export const generateDailyQuiz = async (): Promise<any> => {
  const provider = getAIProvider();
  const prompt = `
    Generate a 5-question multiple-choice quiz about personal finance, investing, or economics, specifically tailored for an Indian audience (e.g., mention RBI, NIFTY, Sensex, mutual funds, income tax regimes, etc.).
    
    Return ONLY a JSON array of objects, where each object has:
    - "question": The question string.
    - "options": An array of 4 string options.
    - "correct": The zero-based index of the correct option (0-3).
    
    Ensure the questions are challenging but accessible, testing real financial literacy.
  `;

  if (provider === 'groq') {
    try {
      const result = await groqChat([
        { role: 'system', content: INDIAN_FINANCE_SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt }
      ], { json: true, temperature: 0.7 });
      
      const parsed = JSON.parse(result);
      // Groq might wrap in an object if json mode was used
      if (parsed.questions) return parsed.questions;
      if (Array.isArray(parsed)) return parsed;
      
      // Fallback extraction
      const match = result.match(/\[.*\]/s);
      if (match) return JSON.parse(match[0]);
      
      throw new Error("Invalid format from Groq");
    } catch (error) {
      console.error("Groq Quiz Gen Error:", error);
      return null;
    }
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correct: { type: Type.INTEGER }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "null");
  } catch (error) {
    console.error("Gemini Quiz Gen Error:", error);
    return null;
  }
};

export const generateFullCourse = async (topic: string): Promise<any> => {
  const provider = getAIProvider();
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
    Return ONLY valid JSON.
  `;

  if (provider === 'groq') {
    try {
      const result = await groqChat([
        { role: 'system', content: INDIAN_FINANCE_SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt },
      ], { json: true });
      return JSON.parse(result);
    } catch (error) {
      console.error("Groq Course Error:", error);
      return null;
    }
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  try {
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
    // Remove markdown code block syntax if present
    let cleanText = response.text || "{}";
    cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonStart = cleanText.indexOf('{');
    const jsonEnd = cleanText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
    }
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Course Generation Error:", error);
    return null;
  }
};


// ═══════════════════════════════════════════════════
// CA SYSTEM — ITR Document Parser
// ═══════════════════════════════════════════════════

export const parseITRDocument = async (file: File): Promise<any> => {
  const provider = getAIProvider();
  const filePart = await fileToGenerativePart(file);

  const prompt = `
    You are an expert Indian Chartered Accountant. Analyze this Income Tax Return (ITR) document carefully.
    Extract ALL available information and return a JSON object with these fields:
    
    {
      "gross_income": number (total gross income),
      "total_income": number (total income after exemptions),
      "total_deductions": number (all deductions claimed),
      "taxable_income": number,
      "tax_paid": number (total tax paid including TDS, advance tax, self-assessment),
      "refund_amount": number (0 if no refund),
      "regime": "Old" or "New",
      "income_sources": {
        "salary": number,
        "business": number,
        "capital_gains": number,
        "house_property": number,
        "other": number
      },
      "deductions": {
        "80C": number,
        "80D": number,
        "80E": number,
        "80G": number,
        "HRA": number,
        "LTA": number,
        "NPS_80CCD": number
      },
      "form_type": "ITR-1" / "ITR-2" / "ITR-3" / "ITR-4" etc.,
      "pan": "masked PAN like XXXXX1234X",
      "acknowledgement_number": string,
      "filing_date": "YYYY-MM-DD",
      "assessment_year": "2024-25",
      "financial_year": "2023-24",
      "summary": "A 2-3 sentence plain English summary of this return including key highlights"
    }
    
    If any field cannot be determined, use null. Return ONLY valid JSON.
  `;

  if (provider === 'groq') {
    try {
      const result = await groqVision(filePart.inlineData.data, filePart.inlineData.mimeType, prompt);
      return JSON.parse(result || "{}");
    } catch (error) {
      console.error("Groq ITR Parse Error:", error);
      return null;
    }
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const result = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: { parts: [filePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      }
    });
    return JSON.parse(result.text || "{}");
  } catch (error) {
    console.error("Gemini ITR Parse Error:", error);
    return null;
  }
};


// ═══════════════════════════════════════════════════
// CA SYSTEM — Invoice OCR Parser
// ═══════════════════════════════════════════════════

export const parseInvoice = async (file: File): Promise<any> => {
  const provider = getAIProvider();
  const filePart = await fileToGenerativePart(file);

  const prompt = `
    You are an expert Indian Chartered Accountant. Analyze this invoice/bill document.
    Extract ALL available information and return a JSON object:
    
    {
      "vendor_name": string,
      "invoice_number": string,
      "invoice_date": "YYYY-MM-DD",
      "due_date": "YYYY-MM-DD" or null,
      "subtotal": number,
      "tax_amount": number (total GST/tax),
      "total_amount": number,
      "gst_number": string or null (vendor's GSTIN),
      "currency": "INR",
      "line_items": [
        {
          "description": string,
          "quantity": number,
          "unit_price": number,
          "amount": number,
          "gst_rate": number (percentage, e.g. 18)
        }
      ],
      "category": string (e.g. "Office Supplies", "Travel", "Professional Services", "Software", "Utilities"),
      "expense_type": "Business" or "Personal" or "Mixed",
      "journal_entry": "A properly formatted accounting journal entry for this invoice. Example: Dr. Office Supplies ₹X,XXX / Dr. Input GST ₹XXX / Cr. Accounts Payable ₹X,XXX"
    }
    
    Return ONLY valid JSON.
  `;

  if (provider === 'groq') {
    try {
      const result = await groqVision(filePart.inlineData.data, filePart.inlineData.mimeType, prompt);
      return JSON.parse(result || "{}");
    } catch (error) {
      console.error("Groq Invoice Parse Error:", error);
      return null;
    }
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const result = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: { parts: [filePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      }
    });
    return JSON.parse(result.text || "{}");
  } catch (error) {
    console.error("Gemini Invoice Parse Error:", error);
    return null;
  }
};


// ═══════════════════════════════════════════════════
// CA SYSTEM — CA-Grade Advice with Citations & CRAG
// ═══════════════════════════════════════════════════

const CA_SYSTEM_INSTRUCTION = `
You are RupeeWise CA, a virtual Chartered Accountant specializing in Indian taxation and financial planning.
You have deep expertise in the Income Tax Act 1961, GST Act, Companies Act, and SEBI regulations.

CRITICAL RULES:
1. ALWAYS cite specific sections of law. Example: "As per Section 80C of the Income Tax Act, 1961..."
2. ALWAYS mention the source and year of any limit/threshold. Example: "The deduction limit is ₹1,50,000 (as per Budget 2023-24)"
3. If you are unsure about a specific number or clause, say "I recommend verifying this with the latest notification from CBDT/CBIC"
4. NEVER make up tax rates or limits. Use only what you are confident about.
5. Format citations as: [Section XX, Income Tax Act 1961] or [Rule XX, Income Tax Rules] or [Circular No. XX/YYYY]
6. Use Indian numbering (Lakhs, Crores) and ₹ symbol
7. For tax planning advice, always compare Old vs New regime impacts
8. Distinguish between tax avoidance (legal) and tax evasion (illegal)
9. Always add a disclaimer that this is AI-generated advice and should be verified by a practicing CA

SELF-CHECK (CRAG Pattern):
Before finalizing your answer, internally verify:
- Does the section number I cited actually exist and relate to this topic?
- Is the limit/threshold I mentioned current for the relevant FY/AY?
- Could my advice be misinterpreted in a way that causes financial harm?
If any check fails, add a caveat or state "I don't have enough information to confirm this specific detail."
`;

export const getCAAdvice = async (
  history: { role: string; parts: { text: string }[] }[],
  taxContext?: string
): Promise<string> => {
  const provider = getAIProvider();
  const systemPrompt = CA_SYSTEM_INSTRUCTION + (taxContext ? `\n\nUser's Tax Context:\n${taxContext}` : '');

  if (provider === 'groq') {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(h => ({
          role: h.role === 'model' ? 'assistant' : 'user',
          content: h.parts[0].text,
        })),
      ];
      return await groqChat(messages);
    } catch (error) {
      console.error("Groq CA Advice Error:", error);
      return "Sorry, I'm having trouble connecting right now. Please try again.";
    }
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) return "Please configure your API Key for CA advice.";
  const ai = new GoogleGenAI({ apiKey });
  try {
    const chat = ai.chats.create({
      model: getGeminiModel(),
      config: { systemInstruction: systemPrompt },
      history: history
    });
    const lastMsg = history[history.length - 1].parts[0].text;
    const result = await chat.sendMessage({ message: lastMsg });
    return result.text || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Gemini CA Advice Error:", error);
    return "Sorry, I'm having trouble connecting to the financial network right now.";
  }
};


// ═══════════════════════════════════════════════════
// CA SYSTEM — Real-Time Tax Estimator (Pure Calculation)
// ═══════════════════════════════════════════════════

export const calculateTaxEstimate = (
  income: { salary: number; business: number; capitalGains: number; houseProperty: number; other: number },
  deductions: { section80C: number; section80D: number; section80E: number; section80G: number; hra: number; lta: number; nps80CCD: number; standardDeduction: number }
): { oldRegime: any; newRegime: any; recommended: string; savings: number; grossIncome: number; totalDeductions: number } => {
  const grossIncome = Object.values(income).reduce((a, b) => a + b, 0);
  const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);

  // ─── New Regime FY 2024-25 (No deductions except standard deduction of ₹75,000) ───
  const newStdDeduction = 75000;
  const newTaxableIncome = Math.max(0, grossIncome - newStdDeduction);
  let newTax = 0;
  const newSlabs = [
    { limit: 300000, rate: 0 },
    { limit: 700000, rate: 0.05 },
    { limit: 1000000, rate: 0.10 },
    { limit: 1200000, rate: 0.15 },
    { limit: 1500000, rate: 0.20 },
    { limit: Infinity, rate: 0.30 },
  ];
  let newRemaining = newTaxableIncome;
  let prevLimit = 0;
  const newSlabBreakdown: { slab: string; rate: string; tax: number }[] = [];
  for (const slab of newSlabs) {
    const slabWidth = slab.limit - prevLimit;
    const taxableInSlab = Math.min(newRemaining, slabWidth);
    const taxInSlab = taxableInSlab * slab.rate;
    if (taxableInSlab > 0) {
      newSlabBreakdown.push({
        slab: slab.limit === Infinity ? `Above ₹${(prevLimit / 100000).toFixed(0)}L` : `₹${(prevLimit / 100000).toFixed(0)}L – ₹${(slab.limit / 100000).toFixed(0)}L`,
        rate: `${(slab.rate * 100).toFixed(0)}%`,
        tax: Math.round(taxInSlab)
      });
    }
    newTax += taxInSlab;
    newRemaining -= taxableInSlab;
    prevLimit = slab.limit;
    if (newRemaining <= 0) break;
  }
  // Rebate u/s 87A for new regime (income up to ₹7L)
  if (newTaxableIncome <= 700000) newTax = 0;
  // Surcharge
  if (grossIncome > 50000000) newTax *= 1.37;
  else if (grossIncome > 20000000) newTax *= 1.25;
  else if (grossIncome > 10000000) newTax *= 1.15;
  else if (grossIncome > 5000000) newTax *= 1.10;
  // Cess 4%
  const newCess = newTax * 0.04;
  const newTotalTax = Math.round(newTax + newCess);

  // ─── Old Regime FY 2024-25 ───
  const oldTaxableIncome = Math.max(0, grossIncome - totalDeductions);
  let oldTax = 0;
  const oldSlabs = [
    { limit: 250000, rate: 0 },
    { limit: 500000, rate: 0.05 },
    { limit: 1000000, rate: 0.20 },
    { limit: Infinity, rate: 0.30 },
  ];
  let oldRemaining = oldTaxableIncome;
  let oldPrevLimit = 0;
  const oldSlabBreakdown: { slab: string; rate: string; tax: number }[] = [];
  for (const slab of oldSlabs) {
    const slabWidth = slab.limit - oldPrevLimit;
    const taxableInSlab = Math.min(oldRemaining, slabWidth);
    const taxInSlab = taxableInSlab * slab.rate;
    if (taxableInSlab > 0) {
      oldSlabBreakdown.push({
        slab: slab.limit === Infinity ? `Above ₹${(oldPrevLimit / 100000).toFixed(0)}L` : `₹${(oldPrevLimit / 100000).toFixed(0)}L – ₹${(slab.limit / 100000).toFixed(0)}L`,
        rate: `${(slab.rate * 100).toFixed(0)}%`,
        tax: Math.round(taxInSlab)
      });
    }
    oldTax += taxInSlab;
    oldRemaining -= taxableInSlab;
    oldPrevLimit = slab.limit;
    if (oldRemaining <= 0) break;
  }
  // Rebate u/s 87A for old regime (income up to ₹5L)
  if (oldTaxableIncome <= 500000) oldTax = 0;
  // Surcharge (same rates)
  if (grossIncome > 50000000) oldTax *= 1.37;
  else if (grossIncome > 20000000) oldTax *= 1.25;
  else if (grossIncome > 10000000) oldTax *= 1.15;
  else if (grossIncome > 5000000) oldTax *= 1.10;
  const oldCess = oldTax * 0.04;
  const oldTotalTax = Math.round(oldTax + oldCess);

  const recommended = newTotalTax <= oldTotalTax ? 'New' : 'Old';
  const savings = Math.abs(oldTotalTax - newTotalTax);

  return {
    oldRegime: {
      taxableIncome: oldTaxableIncome,
      totalTax: oldTotalTax,
      effectiveRate: grossIncome > 0 ? ((oldTotalTax / grossIncome) * 100).toFixed(1) : '0',
      slabBreakdown: oldSlabBreakdown,
      monthlyTds: Math.round(oldTotalTax / 12),
    },
    newRegime: {
      taxableIncome: newTaxableIncome,
      totalTax: newTotalTax,
      effectiveRate: grossIncome > 0 ? ((newTotalTax / grossIncome) * 100).toFixed(1) : '0',
      slabBreakdown: newSlabBreakdown,
      monthlyTds: Math.round(newTotalTax / 12),
    },
    recommended,
    savings,
    grossIncome,
    totalDeductions,
  };
};


// ═══════════════════════════════════════════════════
// CA SYSTEM — Transaction Anomaly Detection
// ═══════════════════════════════════════════════════

export const detectTransactionAnomalies = async (transactions: { merchant: string; amount: number; category: string; date: string; type: string }[]): Promise<any[]> => {
  if (transactions.length < 3) return [];

  const provider = getAIProvider();
  const prompt = `
    You are a forensic accountant. Analyze these transactions and identify anomalies.
    
    Transactions:
    ${JSON.stringify(transactions.slice(0, 50), null, 2)}
    
    Look for:
    1. Duplicate or near-duplicate transactions (same amount, similar date)
    2. Unusual amounts for the category (e.g., ₹50,000 for "Food")
    3. Sudden spikes in spending patterns
    4. Potential misclassified transactions
    5. Round-number transactions that could indicate estimation rather than actual amounts
    
    Return a JSON array of anomaly objects:
    [
      {
        "type": "duplicate" | "unusual_amount" | "spike" | "misclassified" | "round_number",
        "severity": "low" | "medium" | "high",
        "description": string (brief explanation),
        "transaction_indices": [number] (0-based indices of flagged transactions),
        "suggestion": string (what to do about it)
      }
    ]
    
    If no anomalies found, return an empty array [].
    Return ONLY valid JSON.
  `;

  if (provider === 'groq') {
    try {
      const result = await groqChat([
        { role: 'system', content: 'You are a forensic accountant specializing in Indian financial transactions.' },
        { role: 'user', content: prompt },
      ], { json: true, temperature: 0.2 });
      const parsed = JSON.parse(result);
      return Array.isArray(parsed) ? parsed : parsed.anomalies || [];
    } catch (error) {
      console.error("Groq Anomaly Detection Error:", error);
      return [];
    }
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) return [];
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      }
    });
    const parsed = JSON.parse(response.text || "[]");
    return Array.isArray(parsed) ? parsed : parsed.anomalies || [];
  } catch (error) {
    console.error("Gemini Anomaly Detection Error:", error);
    return [];
  }
};
