import { ApiError } from '@google/genai';
import { env } from '../../config/env';
import { geminiClient } from '../ai/gemini.client';
import { PartnerLead } from '../partner-intelligence/partner-intelligence.types';
import { buildCadencePrompt, CADENCE_SYSTEM_PROMPT } from './cadence.prompt';
import { CadenceOutput, cadenceOutputSchema } from './cadence.schema';
import { getCadenceResponseJsonSchema } from './cadence.response-schema';

export async function generateCadenceOutput(lead: PartnerLead): Promise<CadenceOutput> {
  return withTransientRetries(async () => {
    const response = await geminiClient.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: buildCadencePrompt(lead),
      config: {
        systemInstruction: CADENCE_SYSTEM_PROMPT,
        temperature: 0.25,
        maxOutputTokens: 3000,
        thinkingConfig: {
          thinkingBudget: 0,
        },
        responseMimeType: 'application/json',
        responseJsonSchema: getCadenceResponseJsonSchema(),
        httpOptions: { timeout: env.GEMINI_TIMEOUT_MS },
      },
    });

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason === 'MAX_TOKENS') {
      throw new Error('Gemini response was truncated because it reached the output token limit');
    }

    if (!response.text) {
      throw new Error('Gemini returned an empty response');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(response.text);
    } catch {
      throw new Error('Gemini returned invalid JSON');
    }
    return cadenceOutputSchema.parse(parsed);
  }, env.GEMINI_MAX_RETRIES);
}

export async function withTransientRetries<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  wait: (milliseconds: number) => Promise<void> = sleep
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= maxRetries || !isTransientGeminiError(error)) {
        throw error;
      }
      const delay = 250 * 2 ** attempt;
      attempt += 1;
      await wait(delay);
    }
  }
}

export function isTransientGeminiError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 429 || error.status >= 500;
  }
  if (!(error instanceof Error)) return false;
  const candidate = error as Error & { code?: string; status?: number; statusCode?: number };
  const status = candidate.status ?? candidate.statusCode;
  return (
    status === 429 ||
    (typeof status === 'number' && status >= 500) ||
    error.name === 'AbortError' ||
    candidate.code === 'ETIMEDOUT' ||
    candidate.code === 'ECONNRESET' ||
    /timeout/i.test(error.message)
  );
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
