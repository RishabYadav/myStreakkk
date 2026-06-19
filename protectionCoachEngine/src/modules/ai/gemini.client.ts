/**
 * Backward-compatible re-export from the unified LLM client.
 *
 * - `generateResponse` — provider-agnostic, works with both Gemini and OpenAI
 * - `geminiClient` — raw Gemini SDK instance, only used by cadence.generator.ts
 *   (lazy-loaded so it doesn't crash when LLM_PROVIDER=openai)
 */
export { generateResponse, activeProvider, activeModel } from './llm.client';

import { env } from '../../config/env';

// Lazy-init: only created when cadence generator accesses it.
// If LLM_PROVIDER=openai, the cadence generator will fail at call time (not at import time).
let _geminiClient: any = null;

export const geminiClient = new Proxy({} as any, {
  get(_target, prop) {
    if (!_geminiClient) {
      if (env.LLM_PROVIDER !== 'gemini') {
        throw new Error(
          `geminiClient accessed but LLM_PROVIDER="${env.LLM_PROVIDER}". ` +
          `The cadence generator requires LLM_PROVIDER=gemini.`
        );
      }
      const { GoogleGenAI } = require('@google/genai');
      _geminiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    }
    return (_geminiClient as any)[prop];
  },
});
