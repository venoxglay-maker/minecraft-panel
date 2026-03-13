import type { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import type { ChildProcessWithoutNullStreams } from "child_process";
import { getServerStats, sendConsoleCommand, streamServerLogs } from "./docker.js";

interface JwtPayload {
  sub: string;
}

export function initWebsocket(io: SocketIOServer) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error("unauthorized"));
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || "changeme") as JwtPayload;
      (socket as any).userId = payload.sub;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.of("/ws/dashboard").on("connection", (socket: Socket) => {
    console.log("[WS] dashboard connected", (socket as any).userId);
    // TODO: emit initial dashboard summary + subscribe to updates
  });

  io.of(/^\/ws\/server\/\w+$/).on("connection", (socket: Socket) => {
    const nsp = socket.nsp;
    const serverId = nsp.name.split("/").pop()!;
    console.log("[WS] server namespace connected", serverId, (socket as any).userId);

    let logProc: ChildProcessWithoutNullStreams | null = null;
    let metricsTimer: NodeJS.Timeout | null = null;

    try {
      logProc = streamServerLogs(serverId, (line) => {
        socket.emit("console:line", { line });
      });
    } catch (err) {
      console.error("[WS] failed to attach logs", err);
    }

    metricsTimer = setInterval(async () => {
      const stats = await getServerStats(serverId);
      socket.emit("metrics:update", stats);
    }, 5_000);

    socket.on("console:command", async (payload: { command: string }) => {
      if (!payload?.command) return;
      try {
        await sendConsoleCommand(serverId, payload.command);
      } catch (err) {
        console.error("[WS] console command failed", err);
        socket.emit("console:line", { line: `[panel] Failed to execute command: ${payload.command}` });
      }
    });

    socket.on("disconnect", () => {
      console.log("[WS] server namespace disconnected", serverId, (socket as any).userId);
      if (logProc) {
        logProc.kill();
      }
      if (metricsTimer) {
        clearInterval(metricsTimer);
      }
    });
  });
}

