import { $log } from "@tsed/common";
import { PlatformExpress } from "@tsed/platform-express";
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { DB } from "@app/database/index.js";
import { Routines, SocketServices } from "@app/services/index.js";
import { Server } from "@app/Server.js";
import { getRedis } from "@app/database/redis.js";
import { startPaymentWorker } from "@app/services/queues/index.js";

class Application {
  private static instance: Application;
  private httpServer: HttpServer | null = null;
  private io: SocketIOServer | null = null;
  private platform: any = null;
  private isShuttingDown = false;
  private isPrimaryInstance: boolean;

  private constructor() {
    this.isPrimaryInstance = !process.env.pm_id || process.env.pm_id === "0";
    this.setupProcessHandlers();
  }

  static getInstance(): Application {
    if (!this.instance) {
      $log.info("Criando nova instância da aplicação...");
      this.instance = new Application();
    }
    return this.instance;
  }

  // ============================================================
  // PROCESS HANDLERS
  // ============================================================

  private setupProcessHandlers(): void {
    process.on("unhandledRejection", this.handleUnhandledRejection.bind(this));
    process.on("uncaughtException", this.handleUncaughtException.bind(this));
    process.on("warning", this.handleWarning.bind(this));
    process.on("SIGINT", () => this.gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => this.gracefulShutdown("SIGTERM"));
    process.on("SIGHUP", () => this.gracefulShutdown("SIGHUP"));
  }

  private handleUnhandledRejection(reason: Error | any, promise: Promise<any>): void {
    $log.error({
      event: "UNHANDLED_REJECTION",
      message: reason?.message || "Unhandled Promise Rejection",
      stack: reason?.stack,
      reason,
    });
  }

  private handleUncaughtException(error: Error): void {
    $log.error({
      event: "UNCAUGHT_EXCEPTION",
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    this.gracefulShutdown("UNCAUGHT_EXCEPTION");
  }

  private handleWarning(warning: Error): void {
    $log.warn({
      event: "PROCESS_WARNING",
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
    });
  }

  // ============================================================
  // GRACEFUL SHUTDOWN
  // ============================================================

  private async gracefulShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      $log.info("Shutdown já em andamento...");
      return;
    }

    this.isShuttingDown = true;
    $log.info(`Recebido ${signal}. Iniciando shutdown gracioso...`);

    const forceExitTimeout = setTimeout(() => {
      $log.error("Shutdown forçado após timeout");
      process.exit(1);
    }, 30000);

    try {
      await this.closeHttpServer();
      await this.closeSocketIO();
      await this.closePlatform();
      await this.closeDatabase();

      clearTimeout(forceExitTimeout);
      $log.info("Servidor encerrado com sucesso.");
      process.exit(0);
    } catch (error) {
      clearTimeout(forceExitTimeout);
      $log.error("Erro durante shutdown:", error);
      process.exit(1);
    }
  }

  private async closeHttpServer(): Promise<void> {
    if (!this.httpServer) return;

    return new Promise((resolve) => {
      this.httpServer!.close(() => {
        $log.info("HTTP Server fechado");
        resolve();
      });
    });
  }

  private async closeSocketIO(): Promise<void> {
    if (!this.io) return;

    return new Promise((resolve) => {
      this.io!.close(() => {
        $log.info("Socket.IO fechado");
        resolve();
      });
    });
  }

  private async closePlatform(): Promise<void> {
    if (!this.platform) return;

    await this.platform.stop();
    $log.info("Plataforma Ts.ED encerrada");
  }

  private async closeDatabase(): Promise<void> {
    try {
      const db = DB.getInstance();
      if (db && typeof db.close === "function") {
        await db.close();
        $log.info("Conexões de banco fechadas");
      }
    } catch (error) {
      $log.warn("Erro ao fechar banco:", error);
    }
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async start(): Promise<void> {
    try {
      $log.info(`Iniciando servidor... (Instância: ${process.env.pm_id || "0"})`);

      await this.initPlatform();
      await this.initHttpServer();
      await this.initSocketIO();
      await this.initDatabase();
      await this.initRedis();
      await this.initRoutines();
      await this.listen();

      $log.info(`✅ Servidor rodando na porta ${process.env.PORT}`);
    } catch (error: any) {
      $log.error({
        event: "SERVER_BOOTSTRAP_ERROR",
        message: error.message,
        stack: error.stack,
      });
      process.exit(1);
    }
  }

  private async initPlatform(): Promise<void> {
    this.platform = await PlatformExpress.bootstrap(Server);
  }

  private async initHttpServer(): Promise<void> {
    this.httpServer = new HttpServer(this.platform.callback());

    this.httpServer.on("error", (error) => {
      $log.error({ event: "HTTP_SERVER_ERROR", error });
    });
  }

  private async initSocketIO(): Promise<void> {
    this.io = new SocketIOServer(this.httpServer!, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.io.on("error", (error) => {
      $log.error({ event: "SOCKETIO_ERROR", error });
    });

    this.io.on("connection", (socket) => {
      socket.on("error", (error) => {
        $log.error({ event: "SOCKET_CLIENT_ERROR", socketId: socket.id, error });
      });
    });

    SocketServices.getInstance().setSocketServer(this.io);
  }

  private async initDatabase(): Promise<void> {
    try {
      await DB.connect();
      $log.info("✅ Banco de dados conectado");
    } catch (error) {
      $log.error({ event: "DB_INIT_ERROR", error });
      throw error;
    }
  }

  private async initRedis(): Promise<void> {
    await getRedis().connect();
    $log.info("✅ Redis conectado");
  }

  private async initRoutines(): Promise<void> {
    if (!this.isPrimaryInstance) {
      $log.info(`⏭️ Instância ${process.env.pm_id} - rotinas desativadas`);
      return;
    }

    try {
      // BullMQ workers (runs on primary instance only)

      startPaymentWorker();


      const routines = Routines.getInstance();
      routines.everyMinute();
      $log.info("✅ Rotinas inicializadas");
    } catch (error) {
      $log.error({ event: "ROUTINE_INIT_ERROR", error });
    }
  }

  private async listen(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.httpServer!.listen(process.env.PORT, (err?: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // ============================================================
  // GETTERS
  // ============================================================

  getHttpServer(): HttpServer | null {
    return this.httpServer;
  }

  getSocketIO(): SocketIOServer | null {
    return this.io;
  }

  getPlatform(): any {
    return this.platform;
  }
}

// Bootstrap
Application.getInstance().start();

export { Application };
