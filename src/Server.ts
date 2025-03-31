import { join } from "path";
import { Configuration, Inject } from "@tsed/di";
import { PlatformApplication } from "@tsed/common";
import "@tsed/platform-express";
import "@tsed/ajv";
import "@tsed/swagger";
import { config } from "@app/config/index";
import * as rest from "@app/controllers/api/index";
import * as pages from "@app/controllers/pages/index";

@Configuration({
  ...config,
  acceptMimes: ["application/json"],
  httpPort: process.env.PORT || 8083,
  httpsPort: false, // CHANGE
  disableComponentsScan: true,
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
      path: "/doc",
      options: {
        tryItOutEnabled: true,
        showMutatedRequest: false,
        showMutatedResponse: false
      },
      spec: {
        info: {
          version: '1.0.0',
          title: 'Base API',
          description: 'Base API documentation',
          contact: {
            name: 'API Support',
            url: 'https://github.com/raphaelvserafim',
          },
        },
        securityDefinitions: {
          BearerAuth: {
            type: "apiKey",
            in: "header",
            name: "Authorization",
            description: "JWT Authorization header using the Bearer scheme"
          }
        },
      },
    }
  ],
  statics: {
    "/uploads": join(process.cwd(), "uploads"),
    "/assets": join(process.cwd(), "assets")
  },
  middlewares: [
    "cors",
    "cookie-parser",
    "compression",
    "method-override",
    "json-parser",
    { use: "urlencoded-parser", options: { extended: true } }
  ],
  views: {
    root: join(process.cwd(), "../views"),
    extensions: {
      ejs: "ejs"
    }
  },
  exclude: [
    "**/*.spec.ts"
  ]
})
export class Server {
  @Inject()
  protected app: PlatformApplication;

  @Configuration()
  protected settings: Configuration;
}