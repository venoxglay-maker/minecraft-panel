import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../infra/db.js";
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().min(3).max(50)
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});
const refreshSchema = z.object({
    refreshToken: z.string().min(1)
});
function signTokens(userId) {
    const accessToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET || "changeme", {
        expiresIn: "15m"
    });
    const refreshToken = jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET || "changeme_refresh", {
        expiresIn: "7d"
    });
    return { accessToken, refreshToken };
}
async function persistRefreshToken(userId, refreshToken, req) {
    const crypto = await import("crypto");
    const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(`INSERT INTO user_sessions (user_id, refresh_token_hash, ip, user_agent, expires_at)
     VALUES ($1,$2,$3,$4,$5)`, [userId, hash, req.ip || null, req.headers["user-agent"] || null, expiresAt]);
}
export function registerAuthRoutes(app) {
    app.post("/api/v1/auth/register", async (req, res) => {
        const parse = registerSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ error: "Invalid payload", details: parse.error.flatten() });
        }
        const { email, password, displayName } = parse.data;
        const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
        if ((existing.rowCount ?? 0) > 0) {
            return res.status(409).json({ error: "Email already in use" });
        }
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query("INSERT INTO users (email, password_hash, display_name, role) VALUES ($1,$2,$3,$4) RETURNING id,email,display_name,role", [email.toLowerCase(), hash, displayName, "admin"]);
        const user = result.rows[0];
        const tokens = signTokens(user.id);
        await persistRefreshToken(user.id, tokens.refreshToken, req);
        return res.status(201).json({ user, ...tokens });
    });
    app.post("/api/v1/auth/login", async (req, res) => {
        const parse = loginSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ error: "Invalid payload" });
        }
        const { email, password } = parse.data;
        const result = await pool.query("SELECT id, email, password_hash, display_name, role FROM users WHERE email = $1", [email.toLowerCase()]);
        if (result.rowCount === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const tokens = signTokens(user.id);
        await persistRefreshToken(user.id, tokens.refreshToken, req);
        delete user.password_hash;
        return res.json({ user, ...tokens });
    });
    app.post("/api/v1/auth/refresh", async (req, res) => {
        const parse = refreshSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ error: "Invalid payload" });
        }
        const { refreshToken } = parse.data;
        try {
            const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "changeme_refresh");
            const crypto = await import("crypto");
            const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
            const sessionResult = await pool.query("SELECT id, expires_at FROM user_sessions WHERE user_id = $1 AND refresh_token_hash = $2", [payload.sub, hash]);
            if (sessionResult.rowCount === 0) {
                return res.status(401).json({ error: "Invalid refresh token" });
            }
            const session = sessionResult.rows[0];
            if (new Date(session.expires_at) < new Date()) {
                return res.status(401).json({ error: "Refresh token expired" });
            }
            const tokens = signTokens(payload.sub);
            // Option: rotate token by deleting old session and inserting a new one
            await pool.query("DELETE FROM user_sessions WHERE id = $1", [session.id]);
            await persistRefreshToken(payload.sub, tokens.refreshToken, req);
            return res.json({ ...tokens });
        }
        catch {
            return res.status(401).json({ error: "Invalid refresh token" });
        }
    });
    app.post("/api/v1/auth/logout", async (req, res) => {
        const parse = refreshSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ error: "Invalid payload" });
        }
        const { refreshToken } = parse.data;
        try {
            const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "changeme_refresh");
            const crypto = await import("crypto");
            const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
            await pool.query("DELETE FROM user_sessions WHERE user_id = $1 AND refresh_token_hash = $2", [payload.sub, hash]);
        }
        catch {
            // swallow errors to make logout idempotent
        }
        return res.status(204).send();
    });
    app.get("/api/v1/auth/me", async (req, res) => {
        const auth = req.headers.authorization;
        if (!auth?.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        try {
            const token = auth.substring("Bearer ".length);
            const payload = jwt.verify(token, process.env.JWT_SECRET || "changeme");
            const result = await pool.query("SELECT id, email, display_name, role FROM users WHERE id = $1", [payload.sub]);
            if (result.rowCount === 0) {
                return res.status(404).json({ error: "User not found" });
            }
            return res.json({ user: result.rows[0] });
        }
        catch {
            return res.status(401).json({ error: "Unauthorized" });
        }
    });
}
