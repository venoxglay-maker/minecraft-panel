import jwt from "jsonwebtoken";
import { getServerStats, sendConsoleCommand, streamServerLogs } from "./docker.js";
export function initWebsocket(io) {
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error("unauthorized"));
        }
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET || "changeme");
            socket.userId = payload.sub;
            next();
        }
        catch {
            next(new Error("unauthorized"));
        }
    });
    io.of("/ws/dashboard").on("connection", (socket) => {
        console.log("[WS] dashboard connected", socket.userId);
        // TODO: emit initial dashboard summary + subscribe to updates
    });
    io.of(/^\/ws\/server\/\w+$/).on("connection", (socket) => {
        const nsp = socket.nsp;
        const serverId = nsp.name.split("/").pop();
        console.log("[WS] server namespace connected", serverId, socket.userId);
        let logProc = null;
        let metricsTimer = null;
        try {
            logProc = streamServerLogs(serverId, (line) => {
                socket.emit("console:line", { line });
            });
        }
        catch (err) {
            console.error("[WS] failed to attach logs", err);
        }
        metricsTimer = setInterval(async () => {
            const stats = await getServerStats(serverId);
            socket.emit("metrics:update", stats);
        }, 5000);
        socket.on("console:command", async (payload) => {
            if (!payload?.command)
                return;
            try {
                await sendConsoleCommand(serverId, payload.command);
            }
            catch (err) {
                console.error("[WS] console command failed", err);
                socket.emit("console:line", { line: `[panel] Failed to execute command: ${payload.command}` });
            }
        });
        socket.on("disconnect", () => {
            console.log("[WS] server namespace disconnected", serverId, socket.userId);
            if (logProc) {
                logProc.kill();
            }
            if (metricsTimer) {
                clearInterval(metricsTimer);
            }
        });
    });
}
