import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

function loadEnvFile(): void {
  const candidates = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'protectionCoachEngine/.env'),
  ];

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      return;
    }
  }

  dotenv.config();
}

loadEnvFile();

export type LlmProvider = 'gemini' | 'openai';

interface EnvConfig {
  DATABASE_URL: string;
  MONGODB_URI?: string;

  // LLM Provider toggle
  LLM_PROVIDER: LlmProvider;

  // Gemini config
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  GEMINI_TIMEOUT_MS: number;
  GEMINI_MAX_RETRIES: number;
  PYTHON_API_BASE_URL: string;

  // OpenAI config
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  OPENAI_TIMEOUT_MS: number;

  PORT: number;
  NODE_ENV: string;
}

function validateEnv(): EnvConfig {
  const provider = (process.env.LLM_PROVIDER || 'gemini') as LlmProvider;

  if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
    throw new Error('LLM_PROVIDER=gemini but GEMINI_API_KEY is missing');
  }
  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    throw new Error('LLM_PROVIDER=openai but OPENAI_API_KEY is missing');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    MONGODB_URI: process.env.MONGODB_URI,

    LLM_PROVIDER: provider,

    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    GEMINI_TIMEOUT_MS: parsePositiveInt(process.env.GEMINI_TIMEOUT_MS, 15000),
    GEMINI_MAX_RETRIES: Math.min(parsePositiveInt(process.env.GEMINI_MAX_RETRIES, 2), 2),
    PYTHON_API_BASE_URL: process.env.PYTHON_API_BASE_URL || 'http://127.0.0.1:8000',

    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    OPENAI_TIMEOUT_MS: parsePositiveInt(process.env.OPENAI_TIMEOUT_MS, 30000),

    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export const env = validateEnv();
