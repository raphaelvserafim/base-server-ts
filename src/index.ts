import { $log } from "@tsed/common";
import { PlatformExpress } from "@tsed/platform-express";

import { Server } from "@app/Server";
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { SocketServices } from "@app/services";


async function bootstrap() {
  try {
    const platform = await PlatformExpress.bootstrap(Server);

    const httpServer = new HttpServer(platform.callback());

    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    SocketServices.getInstance().setSocketServer(io);


    await new Promise<void>((resolve, reject) => {
      httpServer.listen(process.env.PORT, (err?: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    process.on("SIGINT", () => {
      platform.stop().then(() => {
        io.close();
        $log.info("Servidor encerrado com sucesso.");
        process.exit(0);
      }).catch((error) => {
        $log.error("Erro ao encerrar servidor:", error);
        process.exit(1);
      });
    });

  } catch (error) {
    $log.error({ event: "SERVER_BOOTSTRAP_ERROR", message: error.message, stack: error.stack });
    process.exit(1);
  }
}



bootstrap();