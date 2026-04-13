import { readFileSync } from "fs";
import { getEnv } from "@app/config/envs/index.js";
import { IDbConfig } from "@app/types/index.js";
const pkg = JSON.parse(readFileSync("./package.json", { encoding: "utf8" }));


export const config = {
  version: pkg.version,
  production: process.env.NODE_ENV === "production",
  notificationPush: {
    vapidDetails: {
      subject: `mailto:notificationpush@${getEnv().DOMAIN}`,
      publicKey: getEnv().VAPID_PUBLIC_KEY,
      privateKey: getEnv().VAPID_PRIVATE_KEY,
    }
  },
  wame: {
    session: getEnv().SESSION_API_WAME,
    url: getEnv().URL_API_WHATSAPP,
  },
  logger: {
    level: "error",
    disableRoutesSummary: true,
    disableBootstrapLog: true,
  },
  openai: {
    apiKey: getEnv().OPENAI_API_KEY,
  },
  groq: {
    apiKey: getEnv().GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
    model: "groq/compound",
  },
  huggingface: {
    apiKey: getEnv().HUGGINGFACE_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    model: getEnv().HUGGINGFACE_MODEL || "cognitivecomputations/dolphin-mistral-24b-venice-edition",
  },
  elevenlabs: {
    apiKey: getEnv().ELEVENLABS_API_KEY,
  },
  fishAudio: {
    apiKey: getEnv().FISH_AUDIO_API_KEY,
    baseUrl: 'https://api.fish.audio',
  },
  jwt: {
    secret: getEnv().JWT_KEY || "default_jwt_secret",
    expiresIn: "90d",
  },
  recaptcha: {
    secretKey: getEnv().RECAPTCHA_SECRET_KEY
  },
  google: {
    clientId: getEnv().GOOGLE_CLIENT_ID,
    clientSecret: getEnv().GOOGLE_CLIENT_SECRET,
    redirectUri: getEnv().GOOGLE_REDIRECT_URI,
  },
  email: {
    provider: "sendgrid",
    sendGrid: {
      apiKey: getEnv().TOKEN_SEND_GRID,
    }
  },
  redis: {
    url: getEnv().REDIS_URL,
  },
  system: {
    urlServer: getEnv().URL_SERVER,
    urlFront: getEnv().URL_FRONT,
    name: getEnv().SYSTEM_NAME,
    emailNotifications: getEnv().EMAIL_NOTIFICATIONS,
    domain: getEnv().DOMAIN || "localhost",
    adminKey: getEnv().ADMIN_KEY,
    logo: getEnv().SYSTEM_LOGO,
    phone: "+1 437 522 3417",
    email: "",
    defaultCredits: 110,
  },
  stripe: {
    key: getEnv().STRIPE_KEY,
    signature: getEnv().STRIPE_SIGNATURE,
  },
  pix: {
    apiKey: getEnv().CACHE_SISTEMAS_PAGAMENT_KEY,
  },
  sms: {
    provider: "infobip",
    infobip: {
      apiKey: getEnv().INFOBIP_API_KEY,
    }
  },
  s3: {
    bucket: getEnv().AWS_BUCKET,
    key: getEnv().AWS_ACCESS,
    secret: getEnv().AWS_SECRET,
    public: getEnv().AWS_VIEWS,
    urlFile: getEnv().AWS_URL,
  },
  db: {
    user: getEnv().DB_USER,
    password: getEnv().DB_PASS,
    database: getEnv().DB_NAME,
    options: {
      host: getEnv().DB_HOST,
      dialect: "mysql",
      timezone: '-04:00',
      logging: false,
      port: getEnv().DB_PORT || 3306,
      define: {
        underscored: true,
        freezeTableName: true,
      },
      pool: {
        max: 300,  // suporta 50 workers × ~5 queries simultâneas + folga
        min: 5,
        acquire: 15000, // falha mais rápido em vez de acumular requests por 30s
        idle: 10000,
      },
      retry: {
        max: 3,
      }
    },
  } as IDbConfig,

};