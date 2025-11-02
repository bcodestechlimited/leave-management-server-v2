import { cleanEnv, port, str } from "envalid";

export const env = cleanEnv(Bun.env, {
  MONGODB_URI: str(),
  BREVO_EMAIL: str(),
  BREVO_PASSWORD: str(),
  NODE_ENV: str({
    choices: ["development", "production", "test"],
  }),
  PORT: port() || 3000,
  JWT_SECRET: str(),
  JWT_EXPIRES: str(),
  FRONTEND_URL: str(),
  ADMIN_EMAIL: str(),
  CLOUDINARY_NAME: str(),
  CLOUDINARY_API_KEY: str(),
  CLOUDINARY_API_SECRET: str(),
  ATS_KEY: str(),
});
