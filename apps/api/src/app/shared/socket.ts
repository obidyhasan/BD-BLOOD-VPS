import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { Secret } from "jsonwebtoken";
import config from "../config";
import { jwtHelper } from "../helper/jwtHelper";
import { prisma } from "./prisma";
import { AccountStatus } from "@prisma/client";
import { IJWTPayload } from "../types";

let io: SocketServer | null = null;

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.frontend_urls || "*",
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.use(async (socket, next) => {
    try {
      const rawToken =
        (typeof socket.handshake.auth?.token === "string" &&
          socket.handshake.auth.token.trim()) ||
        "";

      if (!rawToken) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwtHelper.verifyToken(
        rawToken,
        config.jwt.jwt_access_secret as Secret,
      ) as IJWTPayload;

      const donor = await prisma.donor.findUnique({
        where: { email: decoded.email, isDeleted: false },
      });

      if (!donor || donor.accountStatus !== AccountStatus.ACTIVE) {
        return next(new Error("Unauthorized"));
      }

      (socket.data as { donorId: string; email: string }).donorId = donor.id;
      (socket.data as { donorId: string; email: string }).email = donor.email;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const donorId = (socket.data as { donorId?: string }).donorId;
    if (donorId) {
      socket.join(`donor:${donorId}`);
    }

    socket.on("disconnect", () => undefined);
  });

  console.log("📡 Socket.io ready");
  return io;
};

export const getIO = () => io;

export const emitDonorNotification = (
  donorId: string,
  notification: Record<string, unknown>,
) => {
  io?.to(`donor:${donorId}`).emit("notification:new", notification);
};
