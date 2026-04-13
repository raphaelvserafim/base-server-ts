export interface IEnv {

  DB_HOST: string;
  DB_NAME: string;
  DB_USER: string;
  DB_PASS: string;
  DB_PORT: number,

  
  TOKEN_SEND_GRID: string;
  EMAIL_NOTIFICATIONS: string;

  SYSTEM_NAME: string;
  SYSTEM_LOGO: string;

  DOMAIN: string;

  DEFAULT_PICTURE: string;

  ADMIN_KEY: string;
  JWT_KEY: string;

  RECAPTCHA_SECRET_KEY: string;

  INFOBIP_API_KEY: string;

  AWS_SECRET: string;
  AWS_ACCESS: string;
  AWS_VIEWS: string;
  AWS_BUCKET: string;
  AWS_URL: string;

 
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;

  URL_FRONT: string;
  
  URL_VDM: string;
  ADMIN_KEY_VDM: string
  URL_API_WHATSAPP: string;

  URL_SERVER: string;


  OPENAI_API_KEY: string;
  GROQ_API_KEY: string;
  HUGGINGFACE_API_KEY: string;
  HUGGINGFACE_MODEL: string;

  ELEVENLABS_API_KEY: string;
  FISH_AUDIO_API_KEY: string;

  STRIPE_KEY: string;
  STRIPE_SIGNATURE: string;

  FACEBOOK_APP_ID: string;
  FACEBOOK_APP_SECRET: string;

  INSTAGRAM_APP_ID: string;
  INSTAGRAM_APP_SECRET: string;
  INSTAGRAM_CALLBACK_URL: string;

  BREVO_KEY: string;

  SESSION_API_WAME: string;

  META_SYSTEM_TOKEN: string;
  META_VERIFY_TOKEN: string;

  REDIS_URL: string;



  CACHE_SISTEMAS_PAGAMENT_KEY: string;


  VAPID_PRIVATE_KEY: string;
  VAPID_PUBLIC_KEY: string;

}