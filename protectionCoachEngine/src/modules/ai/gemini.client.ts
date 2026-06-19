import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });


export async function generateResponse(prompt: string, context?: string): Promise<string> {
  const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

  const result = await geminiModel.generateContent(fullPrompt);
  const response = result.response;
  return response.text();
}
