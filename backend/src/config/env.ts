import dotenv from "dotenv";

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: required("DATABASE_URL"),
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  },
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  gemini: {
    // Optional on purpose — the app should still boot and every other
    // feature should keep working if this isn't set yet. The AI
    // categorization endpoint checks for this itself and returns a clear
    // 503 rather than crashing the whole server on startup.
    apiKey: process.env.GEMINI_API_KEY,
    // gemini-2.5-flash was retired for new API keys — gemini-3.5-flash-lite
    // is Google's current recommended model for classification/routing
    // tasks like this one (low-latency, cost-optimized, GA as of Aug 2026).
    model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite",
  },
  cloudinary: {
    // Optional, same reasoning as gemini.apiKey above — receipt scanning
    // just 503s until these are set, the rest of the app boots fine.
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};