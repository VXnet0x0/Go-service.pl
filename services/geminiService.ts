
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * GO-SERVICE.PL | NEURAL INDEXER
 */
class NeuralIndex {
  private static cacheKey = 'DLG_SEARCH_INDEX';
  
  static get(query: string) {
    const idx = JSON.parse(sessionStorage.getItem(this.cacheKey) || '{}');
    const entry = idx[query.toLowerCase().trim()];
    if (entry && Date.now() - entry.timestamp < 3600000) return entry; // 1h cache
    return null;
  }

  static set(query: string, data: any) {
    const idx = JSON.parse(sessionStorage.getItem(this.cacheKey) || '{}');
    idx[query.toLowerCase().trim()] = { data, timestamp: Date.now() };
    sessionStorage.setItem(this.cacheKey, JSON.stringify(idx));
  }
}

/**
 * GO-SERVICE.PL | OPTIMIZED NEURAL SEARCH
 */
export const neuralSearchInterpret = async (vagueQuery: string) => {
  const cached = NeuralIndex.get(`interpret_${vagueQuery}`);
  if (cached) return cached.data;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `INTERPRET_INTENT: "${vagueQuery}". Return JSON identifying technical keywords and intent.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            intent: { type: Type.STRING },
            priority: { type: Type.NUMBER }
          },
          required: ["keywords", "intent", "priority"]
        }
      }
    });
    const result = JSON.parse((response.text || "{}").trim());
    NeuralIndex.set(`interpret_${vagueQuery}`, result);
    return result;
  } catch (e) {
    return { keywords: [vagueQuery], intent: "General", priority: 1 };
  }
};

/**
 * GO-SERVICE.PL | QUANTUM SEARCH ENGINE v2 (ULTRA FAST)
 */
export const quantumScrapeEngine = async (query: string) => {
  const cached = NeuralIndex.get(`query_${query}`);
  if (cached) return cached.data;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `FIND_RESOURCES: "${query}". Focus on app downloads and technical docs.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are the primary search node for DriveCorp. Provide direct links and summary."
      }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const results = chunks
      .filter(chunk => chunk.web?.uri)
      .map((chunk: any, index: number) => ({
        id: `node_${Math.random().toString(36).substr(2, 6)}`,
        title: chunk.web.title || `Resource ${index + 1}`,
        url: chunk.web.uri,
        snippet: response.text?.substring(0, 300) || "Data node identified.",
        source: "Global Distributed Node",
        contentType: 'text/html',
        scrapedAt: Date.now()
      }));

    NeuralIndex.set(`query_${query}`, results);
    return results;
  } catch (e) {
    console.error("Engine Error:", e);
    return [];
  }
};

/**
 * GO-SERVICE.PL | DIRECT LINK ANALYZER
 * Analizuje konkretny URL pod kątem zasobów informacyjnych i technicznych.
 */
export const analyzeDirectLink = async (targetUrl: string) => {
  const cached = NeuralIndex.get(`link_${targetUrl}`);
  if (cached) return cached.data;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `ANALYZE_TARGET_URL: "${targetUrl}". Extract information resources, technical context, and potential file structures.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are an advanced URL crawler. Analyze the provided link. Be precise about what resources can be found there. Return data in a structured way."
      }
    });

    const result = {
      id: `link_${Math.random().toString(36).substr(2, 6)}`,
      title: "Analyzed Resource: " + new URL(targetUrl).hostname,
      url: targetUrl,
      snippet: response.text || "No detailed summary available.",
      source: "Direct Link Scrape",
      contentType: 'application/node-resource',
      scrapedAt: Date.now()
    };

    NeuralIndex.set(`link_${targetUrl}`, result);
    return result;
  } catch (e) {
    console.error("Direct Scrape Error:", e);
    throw new Error("Failed to analyze the specified link. Ensure the URL is valid.");
  }
};

export const generateAppIcon = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Futuristic minimalist app icon for: ${prompt}. Cyberpunk aesthetic.` }]
      }
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (e) { return null; }
  return null;
};

export const startAssistantChat = () => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: "You are the Go-service.pl Neural Assistant. You help users navigate DLG protocols."
    }
  });
};
