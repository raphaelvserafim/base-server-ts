import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { getEnv } from "@app/config/env";
import { AuthSession } from "@app/types";

const { JWT_KEY } = getEnv();

export class SocketServices {
  private static instance: SocketServices;
  private io!: SocketIOServer;
  private userSockets = new Map<number, string>();

  private constructor() { }

  static getInstance(): SocketServices {
    if (!SocketServices.instance) {
      SocketServices.instance = new SocketServices();
    }
    return SocketServices.instance;
  }

  setSocketServer(io: SocketIOServer) {
    this.io = io;

    this.io.use((socket, next) => {
      try {
        const session = (socket.handshake.auth.session as string)?.split(" ")[1];
        if (!session) {
          throw new Error("No session provided");
        }

        jwt.verify(session, JWT_KEY);
        const decoded = jwt.decode(session) as AuthSession;

        this.addSocket(decoded, socket);
        return next();
      } catch (error) {
        socket.emit("auth_error", { message: "Invalid session" });
        setTimeout(() => socket.disconnect(), 1000);
      }
    });

    this.io.on("connection", (socket) => {
      socket.on("disconnect", () => {
        this.removeSocket(socket.id);
      });
    });
  }

  private addSocket(session: AuthSession, socket: Socket) {
    this.userSockets.set(session.userId, socket.id);
    socket.emit("auth_success", { message: "Authenticated" });
  }

  private removeSocket(socketId: string) {
    for (const [userId, id] of this.userSockets.entries()) {
      if (id === socketId) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }


  sendNotification(userIds: number[], type: string, data: { [key: string]: any }) {
    for (const user of userIds) {
      const socketId = this.userSockets.get(user);
      if (!socketId) {
        console.warn(`⚠️ Usuário ${user} não está conectado.`);
        return;
      }
      this.io.to(socketId).emit(type, { data });
    }
  }
 
}
