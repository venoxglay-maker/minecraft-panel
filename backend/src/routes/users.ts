import type { Express, Request, Response, NextFunction } from "express";
import { pool } from "../infra/db.js";
import { requireAuth } from "../util/requireAuth.js";

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId as string | undefined;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const result = await pool.query("SELECT role FROM users WHERE id = $1", [userId]);
  if (result.rowCount === 0 || result.rows[0].role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

export function registerUserRoutes(app: Express) {
  app.get(
    "/api/v1/users",
    requireAuth,
    requireAdmin,
    async (_req: Request, res: Response) => {
      const result = await pool.query(
        "SELECT id,email,display_name,role,created_at,last_login_at FROM users ORDER BY created_at DESC"
      );
      res.json({ users: result.rows });
    }
  );
}

