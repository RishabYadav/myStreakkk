import dotenv from 'dotenv';
dotenv.config();

interface EnvConfig {
  DATABASE_URL: string;
  MONGODB_URI: string;
  GEMINI_API_KEY: string;
  PORT: number;
  NODE_ENV: string;
}

function validateEnv(): EnvConfig {
  const required = ['DATABASE_URL', 'MONGODB_URI', 'GEMINI_API_KEY'];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    MONGODB_URI: process.env.MONGODB_URI!,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
}

export const env = validateEnv();
