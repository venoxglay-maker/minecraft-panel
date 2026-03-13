import { z } from "zod";
import { pool } from "../infra/db.js";
import { requireAuth } from "../util/requireAuth.js";
import { powerServerContainer, provisionServerContainer } from "../infra/docker.js";
const createServerSchema = z.object({
    name: z.string().min(3).max(50),
    description: z.string().max(255).optional(),
    type: z.enum(["vanilla", "paper", "spigot", "bukkit", "forge", "fabric", "mohist", "magma"]),
    minecraftVersion: z.string(),
    javaVersion: z.string(),
    ramMb: z.number().int().min(1024),
    port: z.number().int().min(25565).max(25665).optional(),
    modpackId: z.string().uuid().optional(),
    worldProfileId: z.string().uuid().optional()
});
export function registerServerRoutes(app) {
    app.get("/api/v1/servers", requireAuth, async (_req, res) => {
        const result = await pool.query("SELECT id,name,description,type,minecraft_version,java_version,ram_mb,port,install_state,power_state FROM servers ORDER BY created_at DESC");
        return res.json({ servers: result.rows });
    });
    app.post("/api/v1/servers", requireAuth, async (req, res) => {
        const parse = createServerSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ error: "Invalid payload", details: parse.error.flatten() });
        }
        const { name, description, type, minecraftVersion, javaVersion, ramMb, port, modpackId, worldProfileId } = parse.data;
        const ownerId = req.userId;
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const result = await client.query(`INSERT INTO servers (owner_user_id,name,description,type,minecraft_version,java_version,ram_mb,port,install_state,power_state,modpack_id,world_profile_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'creating','offline',$9,$10)
         RETURNING *`, [
                ownerId,
                name,
                description ?? null,
                type,
                minecraftVersion,
                javaVersion,
                ramMb,
                port ?? null,
                modpackId ?? null,
                worldProfileId ?? null
            ]);
            const server = result.rows[0];
            // provision docker container synchronously for now
            await provisionServerContainer({
                id: server.id,
                name: server.name,
                type: server.type,
                minecraftVersion: server.minecraft_version,
                javaVersion: server.java_version,
                ramMb: server.ram_mb,
                port: server.port
            });
            await client.query("UPDATE servers SET install_state = 'ready', power_state = 'running', updated_at = NOW() WHERE id = $1", [server.id]);
            await client.query("COMMIT");
            const finalServerResult = await pool.query("SELECT id,name,description,type,minecraft_version,java_version,ram_mb,port,install_state,power_state FROM servers WHERE id = $1", [server.id]);
            return res.status(201).json({ server: finalServerResult.rows[0] });
        }
        catch (err) {
            await client.query("ROLLBACK");
            console.error("[servers] failed to provision server", err);
            return res.status(500).json({ error: "Failed to create server" });
        }
        finally {
            client.release();
        }
    });
    app.post("/api/v1/servers/:id/power", requireAuth, async (req, res) => {
        const { id } = req.params;
        const action = String(req.body?.action ?? "");
        if (!["start", "stop", "restart", "kill"].includes(action)) {
            return res.status(400).json({ error: "Invalid action" });
        }
        try {
            await powerServerContainer(id, action);
            await pool.query("UPDATE servers SET power_state = $2, updated_at = NOW() WHERE id = $1", [id, action === "start" || action === "restart" ? "running" : "offline"]);
            return res.json({ status: "ok", action, serverId: id });
        }
        catch (err) {
            console.error("[servers] power action failed", err);
            return res.status(500).json({ error: "Failed to execute power action" });
        }
    });
}
