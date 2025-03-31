import { Env } from "@app/schema/Env";
import * as dotenv from 'dotenv';
dotenv.config();

const env = process.env;

export const getEnv = (): Env => {
  const envKeys = Object.keys(env);
  const requiredEnvKeys = ["ADMIN_KEY", "DB_HOST", "DB_NAME", "DB_USER", "DB_PASS"];
  const missingEnvKeys = requiredEnvKeys.filter(
    (key) => !envKeys.includes(key)
  );
  if (missingEnvKeys.length > 0) {
    throw new Error(`Variáveis ​​de ambiente ausentes: ${missingEnvKeys.join(", ")}`);
  }
  return {
    ADMIN_KEY: env.ADMIN_KEY as string,
    DB_HOST: env.DB_HOST as string,
    DB_NAME: env.DB_NAME as string,
    DB_USER: env.DB_USER as string,
    DB_PASS: env.DB_PASS as string,
    TOKEN_SEND_GRID: env.TOKEN_SEND_GRID as string,
    EMAIL_NOTIFICATIONS: env.EMAIL_NOTIFICATIONS as string,
    SYSTEM_NAME: env.SYSTEM_NAME as string,
    JWT_KEY: env.JWT_KEY as string,
  };
};
