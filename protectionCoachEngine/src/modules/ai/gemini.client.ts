import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env';

export const geminiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });


export async function generateResponse(prompt: string, context?: string): Promise<string> {
  const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

  const response = await geminiClient.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: fullPrompt,
    config: {
      temperature: 0.8,
      maxOutputTokens: 800,
      httpOptions: { timeout: env.GEMINI_TIMEOUT_MS },
    },
  });
  return response.text || '';
}
