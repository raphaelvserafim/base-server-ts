import { IEnv } from '@app/types/index.js';
import * as dotenv from 'dotenv';

dotenv.config();


export const getEnv = (): IEnv => {
  const env = process.env;

  return {
    DB_HOST: env.DB_HOST || '',
    DB_NAME: env.DB_NAME || '',
    DB_USER: env.DB_USER || '',
    DB_PASS: env.DB_PASS || '',
    DB_PORT: env.DB_PORT ? Number(env.DB_PORT) : 3306,

    TOKEN_SEND_GRID: env.TOKEN_SEND_GRID || '',
    EMAIL_NOTIFICATIONS: env.EMAIL_NOTIFICATIONS || '',
    SYSTEM_NAME: env.SYSTEM_NAME || '',
    SYSTEM_LOGO: env.SYSTEM_LOGO || '',
    DOMAIN: env.DOMAIN || 'localhost',

    DEFAULT_PICTURE: env.DEFAULT_PICTURE || '',

    ADMIN_KEY: env.ADMIN_KEY || '',

    JWT_KEY: env.JWT_KEY || '',

    RECAPTCHA_SECRET_KEY: env.RECAPTCHA_SECRET_KEY || '',

    INFOBIP_API_KEY: env.INFOBIP_API_KEY || '',

    AWS_SECRET: env.AWS_SECRET || '',
    AWS_ACCESS: env.AWS_ACCESS || '',
    AWS_VIEWS: env.AWS_VIEWS || '',
    AWS_BUCKET: env.AWS_BUCKET || '',
    AWS_URL: env.AWS_URL || '',

    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET || '',
    GOOGLE_REDIRECT_URI: env.GOOGLE_REDIRECT_URI || '',

    URL_FRONT: env.URL_FRONT || '',
    URL_SERVER: env.URL_SERVER || '',

    URL_VDM: env.URL_VDM || '',
    ADMIN_KEY_VDM: env.ADMIN_KEY_VDM || '',
    URL_API_WHATSAPP: env.URL_API_WHATSAPP || '',

    OPENAI_API_KEY: env.OPENAI_API_KEY || '',
    GROQ_API_KEY: env.GROQ_API_KEY || '',
    HUGGINGFACE_API_KEY: env.HUGGINGFACE_API_KEY || '',
    HUGGINGFACE_MODEL: env.HUGGINGFACE_MODEL || '',
    ELEVENLABS_API_KEY: env.ELEVENLABS_API_KEY || '',
    FISH_AUDIO_API_KEY: env.FISH_AUDIO_API_KEY || '',

    STRIPE_KEY: env.STRIPE_KEY || '',
    STRIPE_SIGNATURE: env.STRIPE_SIGNATURE || '',

    FACEBOOK_APP_ID: env.FACEBOOK_APP_ID || '',
    FACEBOOK_APP_SECRET: env.FACEBOOK_APP_SECRET || '',

    INSTAGRAM_APP_ID: env.INSTAGRAM_APP_ID || '',
    INSTAGRAM_APP_SECRET: env.INSTAGRAM_APP_SECRET || '',
    INSTAGRAM_CALLBACK_URL: env.INSTAGRAM_CALLBACK_URL || '',

    BREVO_KEY: env.BREVO_KEY || '',

    SESSION_API_WAME: env.SESSION_API_WAME || '',

    META_SYSTEM_TOKEN: env.META_SYSTEM_TOKEN || '',
    META_VERIFY_TOKEN: env.META_VERIFY_TOKEN || 'koalla',

    REDIS_URL: env.REDIS_URL || 'redis://localhost:6379',


    CACHE_SISTEMAS_PAGAMENT_KEY: env.CACHE_SISTEMAS_PAGAMENT_KEY || '',


    VAPID_PUBLIC_KEY: env.VAPID_PUBLIC_KEY || '',
    VAPID_PRIVATE_KEY: env.VAPID_PRIVATE_KEY || '',
  };
};