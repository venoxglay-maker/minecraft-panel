import { pool } from "../infra/db.js";
import { requireAuth } from "../util/requireAuth.js";
async function requireAdmin(req, res, next) {
    const userId = req.userId;
    if (!userId)
        return res.status(401).json({ error: "Unauthorized" });
    const result = await pool.query("SELECT role FROM users WHERE id = $1", [userId]);
    if (result.rowCount === 0 || result.rows[0].role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
    }
    next();
}
export function registerUserRoutes(app) {
    app.get("/api/v1/users", requireAuth, requireAdmin, async (_req, res) => {
        const result = await pool.query("SELECT id,email,display_name,role,created_at,last_login_at FROM users ORDER BY created_at DESC");
        res.json({ users: result.rows });
    });
}
