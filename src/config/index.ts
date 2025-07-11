import { readFileSync } from "fs";
const pkg = JSON.parse(readFileSync("./package.json", { encoding: "utf8" }));
import { getEnv } from "@app/config/envs";


export const config = {
  version: pkg.version,
  logger: {
    level: "info",
    disableRoutesSummary: true,
    disableBootstrapLog: true,
  },
  jwt: {
    secret: getEnv().JWT_KEY,
    expiresIn: "90d",
  },
  google: {
    clientId: getEnv().GOOLE_CLIENT_ID,
  },
  email: {
    provider: "sendgrid",
    sendGrid: {
      apiKey: getEnv().TOKEN_SEND_GRID,
    }
  },
  system: {
    name: getEnv().SYSTEM_NAME,
    emailNotifications: getEnv().EMAIL_NOTIFICATIONS,
    domain: "",
  },
  sms: {
    provider: "infobip",
    infobip: {
      apiKey: getEnv().INFOBIP_API_KEY,
    }
  }
};
