/**
 * Unified LLM Client
 *
 * Provider-agnostic interface for text generation.
 * Toggle between Gemini and OpenAI via a single env var:
 *
 *   LLM_PROVIDER=gemini   →  uses Google Gemini (default)
 *   LLM_PROVIDER=openai   →  uses OpenAI GPT
 *
 * All code in the app calls `generateResponse(prompt)` — no provider-specific
 * logic leaks outside this file.
 */

import { env, LlmProvider } from '../../config/env';

// ─── Provider interfaces ──────────────────────────────────────

interface LlmClient {
  generateResponse(prompt: string, context?: string): Promise<string>;
  provider: LlmProvider;
  model: string;
}

// ─── Gemini provider ──────────────────────────────────────────

function createGeminiClient(): LlmClient {
  const { GoogleGenAI } = require('@google/genai');
  const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

  return {
    provider: 'gemini',
    model: env.GEMINI_MODEL,
    async generateResponse(prompt: string, context?: string): Promise<string> {
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

      const response = await client.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: fullPrompt,
        config: {
          temperature: 0.8,
          maxOutputTokens: 800,
          httpOptions: { timeout: env.GEMINI_TIMEOUT_MS },
        },
      });

      return response.text || '';
    },
  };
}

// ─── OpenAI provider ──────────────────────────────────────────

function createOpenAIClient(): LlmClient {
  const OpenAI = require('openai').default;
  const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    timeout: env.OPENAI_TIMEOUT_MS,
  });

  return {
    provider: 'openai',
    model: env.OPENAI_MODEL,
    async generateResponse(prompt: string, context?: string): Promise<string> {
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

      const response = await client.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.8,
        max_tokens: 800,
      });

      return response.choices[0]?.message?.content || '';
    },
  };
}

// ─── Factory ──────────────────────────────────────────────────

function createClient(): LlmClient {
  switch (env.LLM_PROVIDER) {
    case 'openai':
      return createOpenAIClient();
    case 'gemini':
    default:
      return createGeminiClient();
  }
}

// ─── Singleton instance ───────────────────────────────────────

const llmClient = createClient();

console.log(`🧠 LLM Provider: ${llmClient.provider} (model: ${llmClient.model})`);

// ─── Public API (same signature as the old gemini.client.ts) ──

export async function generateResponse(prompt: string, context?: string): Promise<string> {
  return llmClient.generateResponse(prompt, context);
}

export const activeProvider = llmClient.provider;
export const activeModel = llmClient.model;
