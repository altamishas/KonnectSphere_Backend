import { config as conf } from "dotenv";
conf();

const _config = {
  //_config shows it is a private variable
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  NODE_ENV: process.env.NODE_ENV,
  JSON_WEB_TOKEN_SECRET: process.env.JSON_WEB_TOKEN_SECRET,
  Cloudinary_api_key: process.env.Cloudinary_api_key,
  Cloudinary_api_secret: process.env.Cloudinary_api_secret,
  Cloudinary_Cloud_Name: process.env.Cloudinary_Cloud_Name,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE,
  JWT_COOKIE_EXPIRE: process.env.JWT_COOKIE_EXPIRE,
  FRONTEND_URL: process.env.FRONTEND_URL,
  EMAIL_HOST: process.env.EMAIL_HOST || "smtp.gmail.com",
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || "587"),
  EMAIL_SECURE: process.env.EMAIL_SECURE || "false",
  EMAIL_USER: process.env.EMAIL_USER || "konnectsphere123@gmail.com",
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || "KonnectSphere",
  EMAIL_FROM_ADDRESS:
    process.env.EMAIL_FROM_ADDRESS || "konnectsphere123@gmail.com",
  CONTACT_EMAIL: process.env.CONTACT_EMAIL || "contact@konnectsphere.net",
  PASSWORD_RESET_EXPIRY: parseInt(process.env.PASSWORD_RESET_EXPIRY || "60"),
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NGROK_TUNNEL_URL: process.env.NGROK_TUNNEL_URL,
};

export const config = Object.freeze(_config);
