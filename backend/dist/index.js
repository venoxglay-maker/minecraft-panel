import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import { Server as SocketIOServer } from "socket.io";
import { json } from "express";
import { initDb } from "./infra/db.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerServerRoutes } from "./routes/servers.js";
import { registerDashboardRoutes } from "./routes/dashboard.js";
import { registerFileRoutes } from "./routes/files.js";
import { registerModpackRoutes } from "./routes/modpacks.js";
import { registerUserRoutes } from "./routes/users.js";
import { initWebsocket } from "./infra/websocket.js";
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
async function main() {
    await initDb();
    const app = express();
    const server = http.createServer(app);
    const io = new SocketIOServer(server, {
        cors: {
            origin: "*"
        }
    });
    app.use(cors({
        origin: "*",
        credentials: true
    }));
    app.use(helmet());
    app.use(json({ limit: "10mb" }));
    app.get("/api/health", (_req, res) => {
        res.json({ status: "ok" });
    });
    registerAuthRoutes(app);
    registerServerRoutes(app);
    registerDashboardRoutes(app);
    registerFileRoutes(app);
    registerModpackRoutes(app);
    registerUserRoutes(app);
    initWebsocket(io);
    server.listen(PORT, () => {
        console.log(`[API] listening on port ${PORT}`);
    });
}
main().catch((err) => {
    console.error("Fatal error during startup", err);
    process.exit(1);
});
