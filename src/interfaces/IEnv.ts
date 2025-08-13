export interface IEnv {
  ADMIN_KEY: string;
  DB_HOST: string;
  DB_NAME: string;
  DB_USER: string;
  DB_PASS: string;
  DB_PORT: number,
  TOKEN_SEND_GRID: string;
  EMAIL_NOTIFICATIONS: string;
  SYSTEM_NAME: string;
  JWT_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  INFOBIP_API_KEY: string;
}
