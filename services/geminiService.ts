import { GoogleGenAI, Type } from "@google/genai";
import { WordItem } from "../types";

// Helper to get today's date YYYY-MM-DD
const getTodayDate = () => new Date().toISOString().split('T')[0];

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Scans an image for English words.
 */
export const scanImageForWords = async (base64Image: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "Extract all distinct English vocabulary words from this image. Ignore common stopwords (the, a, an, etc.) and partial words. Return ONLY a clean JSON array of strings."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "[]";
    const words = JSON.parse(text);
    return Array.isArray(words) ? words : [];
  } catch (error) {
    console.error("Error scanning image:", error);
    throw new Error("Failed to scan image. Please try again.");
  }
};

/**
 * Enriches a list of raw words with definitions, translations, and examples.
 */
export const enrichWords = async (rawWords: string[]): Promise<WordItem[]> => {
  if (rawWords.length === 0) return [];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        For the following list of words: ${JSON.stringify(rawWords)}.
        Provide a JSON object for each word containing:
        - "text": the word itself (lowercase)
        - "definition": a short, clear English definition (max 15 words)
        - "translation": a concise Chinese translation
        - "example": a short example sentence using the word
        
        Return a JSON array of objects.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              definition: { type: Type.STRING },
              translation: { type: Type.STRING },
              example: { type: Type.STRING },
            },
            required: ["text", "definition", "translation", "example"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");
    
    // Map to WordItem structure
    return data.map((item: any) => ({
      id: crypto.randomUUID(),
      text: item.text,
      definition: item.definition,
      translation: item.translation,
      example: item.example,
      dateAdded: getTodayDate(),
      masteryLevel: 0
    }));

  } catch (error) {
    console.error("Error enriching words:", error);
    throw new Error("Failed to process words.");
  }
};
