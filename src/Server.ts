import { join } from "path";
import { Configuration, inject } from "@tsed/di";
import cors from "cors";
import "@tsed/platform-express";
import "@tsed/ajv";
import "@tsed/swagger";
import "@tsed/engines";
import { config } from "@app/config/index.js";
import * as rest from "@app/controllers/api/index.js";
import * as pages from "@app/controllers/pages/index.js";
import * as services from "@app/services/index.js";
import { NotFoundMiddleware } from "@app/middlewares/index.js";
import { Next, PlatformApplication, Req, Res } from "@tsed/common";

@Configuration({
  ...config,
  acceptMimes: ["application/json"],
  httpPort: process.env.PORT || 3001,
  httpsPort: false,
  disableComponentsScan: true,
  imports: [
    ...Object.values(services)
  ],
  ajv: {
    returnsCoercedValues: true
  },
  mount: {
    "/v1": [
      ...Object.values(rest)
    ],
    "/": [
      ...Object.values(pages)
    ]
  },
  swagger: [
    {
      path: "/docs",
      specVersion: "3.0.1",
      options: {
        tryItOutEnabled: true,
        showMutatedRequest: false,
        showMutatedResponse: false
      },
      spec: {
        info: {
          version: '2.0.0',
          title: 'API Documentation',
        },
        servers: [
          {
            url: 'http://localhost:3001',
            description: 'Development API'
          },


        ],
        components: {
          securitySchemes: {
            BearerAuth: {
              type: "apiKey",
              in: "header",
              name: "Authorization",
              description: "JWT Authorization header using the Bearer scheme"
            }
          }
        },
      },
    }
  ],
  statics: {
    "public": join(process.cwd(), "public")
  },
  middlewares: [
    "cookie-parser",
    "compression",
    "method-override",
    { use: "json-parser", options: { limit: "1gb" } },
    { use: "urlencoded-parser", options: { extended: true, limit: "1gb" } },
    { use: "raw-parser", options: { limit: "1gb" } },
  ],

  logger: {
    level: process.env.NODE_ENV === "production" ? "warn" : "info"
  },
  exclude: [
    "**/*.spec.ts"
  ]
})


export class Server {
  private app = inject(PlatformApplication);

  $beforeRoutesInit(): void {

    const allowedOrigins: string[] | true = config.production
      ? (process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : [process.env.URL_FRONT ?? '']
      ).filter((o): o is string => Boolean(o))
      : true;

    console.log('[CORS] Allowed origins:', allowedOrigins);

    this.app.use(cors({
      origin: (origin, callback) => {
        // Permite requisições sem origin (ex: curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins === true || (allowedOrigins as string[]).includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`[CORS] Blocked origin: "${origin}"`);
          callback(new Error(`CORS: origin "${origin}" not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Authorization'],
      maxAge: 86400,
      preflightContinue: false,
      optionsSuccessStatus: 204
    }));

    this.app.use((req: Req, res: Res, next: Next) => {
      console.log(`${new Date().toISOString()} 📨 ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No origin'}`);
      /// res.json({ message: "Hello from Vespy API!" });
      next();
    });



  }

  $afterRoutesInit(): void {
    this.app.use(NotFoundMiddleware);
  }

  $onReady(): void {
    console.log("✅ Server ready");
  }

  $onDestroy(): void {
    console.log("👋 Server shutting down");
  }
}