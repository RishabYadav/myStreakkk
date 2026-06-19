import dotenv from 'dotenv';
dotenv.config();

interface EnvConfig {
  DATABASE_URL: string;
  MONGODB_URI?: string;
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  GEMINI_TIMEOUT_MS: number;
  GEMINI_MAX_RETRIES: number;
  PORT: number;
  NODE_ENV: string;
}

function validateEnv(): EnvConfig {
  const required = ['DATABASE_URL', 'GEMINI_API_KEY'];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    MONGODB_URI: process.env.MONGODB_URI,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    GEMINI_TIMEOUT_MS: parsePositiveInt(process.env.GEMINI_TIMEOUT_MS, 15000),
    GEMINI_MAX_RETRIES: Math.min(parsePositiveInt(process.env.GEMINI_MAX_RETRIES, 2), 2),
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export const env = validateEnv();
