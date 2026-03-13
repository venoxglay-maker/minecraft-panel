import type { Express, Request, Response } from "express";
import { pool } from "../infra/db.js";

export function registerDashboardRoutes(app: Express) {
  app.get("/api/v1/dashboard/summary", async (_req: Request, res: Response) => {
    const totalServersQ = await pool.query("SELECT COUNT(*)::int AS total, SUM((power_state = 'running')::int)::int AS running FROM servers");
    const playersQ = await pool.query(
      "SELECT COALESCE(SUM(online_players),0)::int AS players_online FROM server_runtime_state"
    ).catch(() => ({ rows: [{ players_online: 0 }] }));

    const totalServers = totalServersQ.rows[0]?.total ?? 0;
    const runningServers = totalServersQ.rows[0]?.running ?? 0;
    const playersOnline = playersQ.rows[0]?.players_online ?? 0;

    return res.json({
      totalServers,
      runningServers,
      playersOnline
      // Memory/CPU/TPS will later be aggregated from timeseries/Redis
    });
  });
}

