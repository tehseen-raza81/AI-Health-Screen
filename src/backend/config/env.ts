import dotenv from 'dotenv';

// Load from .env if present
dotenv.config();

function getValidApiKey(): string {
  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.API_KEY,
    process.env.GOOGLE_GENAI_API_KEY,
  ];

  for (const c of candidates) {
    if (c && typeof c === 'string' && c.trim().length > 10 && !c.includes('your_gemini_api_key')) {
      return c.trim();
    }
  }

  return '';
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 3000,
  GEMINI_API_KEY: getValidApiKey(),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
