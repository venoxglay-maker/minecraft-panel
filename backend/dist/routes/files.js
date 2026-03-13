import fs from "fs/promises";
import path from "path";
import { requireAuth } from "../util/requireAuth.js";
import formidable from "formidable";
import archiver from "archiver";
import { createReadStream, createWriteStream } from "fs";
const SERVERS_BASE = process.env.SERVERS_BASE_DIR ||
    "/data/servers"; // in Docker-Umgebung als Volume einbinden
function resolveServerPath(serverId, relativePath) {
    const base = path.join(SERVERS_BASE, serverId);
    const full = path.normalize(path.join(base, relativePath));
    if (!full.startsWith(base)) {
        throw new Error("Path traversal detected");
    }
    return full;
}
export function registerFileRoutes(app) {
    app.get("/api/v1/servers/:id/files/list", requireAuth, async (req, res) => {
        const { id } = req.params;
        const relPath = String(req.query.path || "/");
        try {
            const full = resolveServerPath(id, relPath);
            const entries = await fs.readdir(full, { withFileTypes: true });
            const items = await Promise.all(entries.map(async (ent) => {
                const stat = await fs.stat(path.join(full, ent.name));
                return {
                    name: ent.name,
                    isDirectory: ent.isDirectory(),
                    size: stat.size,
                    mtime: stat.mtime
                };
            }));
            res.json({ items });
        }
        catch (err) {
            console.error(err);
            res.status(400).json({ error: "Unable to list directory" });
        }
    });
    app.get("/api/v1/servers/:id/files/content", requireAuth, async (req, res) => {
        const { id } = req.params;
        const relPath = String(req.query.path || "/");
        try {
            const full = resolveServerPath(id, relPath);
            const content = await fs.readFile(full, "utf8");
            res.json({ content });
        }
        catch (err) {
            console.error(err);
            res.status(400).json({ error: "Unable to read file" });
        }
    });
    app.put("/api/v1/servers/:id/files/content", requireAuth, async (req, res) => {
        const { id } = req.params;
        const relPath = String(req.body.path || "/");
        const content = String(req.body.content ?? "");
        try {
            const full = resolveServerPath(id, relPath);
            await fs.writeFile(full, content, "utf8");
            res.json({ ok: true });
        }
        catch (err) {
            console.error(err);
            res.status(400).json({ error: "Unable to write file" });
        }
    });
    app.post("/api/v1/servers/:id/files/mkdir", requireAuth, async (req, res) => {
        const { id } = req.params;
        const relPath = String(req.body.path || "/");
        try {
            const full = resolveServerPath(id, relPath);
            await fs.mkdir(full, { recursive: true });
            res.json({ ok: true });
        }
        catch (err) {
            console.error(err);
            res.status(400).json({ error: "Unable to create directory" });
        }
    });
    app.post("/api/v1/servers/:id/files/rename", requireAuth, async (req, res) => {
        const { id } = req.params;
        const fromPath = String(req.body.from);
        const toPath = String(req.body.to);
        try {
            const fromFull = resolveServerPath(id, fromPath);
            const toFull = resolveServerPath(id, toPath);
            await fs.rename(fromFull, toFull);
            res.json({ ok: true });
        }
        catch (err) {
            console.error(err);
            res.status(400).json({ error: "Unable to rename" });
        }
    });
    app.post("/api/v1/servers/:id/files/delete", requireAuth, async (req, res) => {
        const { id } = req.params;
        const relPath = String(req.body.path || "/");
        try {
            const full = resolveServerPath(id, relPath);
            const stat = await fs.stat(full);
            if (stat.isDirectory()) {
                await fs.rm(full, { recursive: true, force: true });
            }
            else {
                await fs.unlink(full);
            }
            res.json({ ok: true });
        }
        catch (err) {
            console.error(err);
            res.status(400).json({ error: "Unable to delete" });
        }
    });
    app.post("/api/v1/servers/:id/files/upload", requireAuth, async (req, res) => {
        const { id } = req.params;
        const relPath = String(req.query.path || "/");
        const form = formidable({
            multiples: true,
            keepExtensions: true
        });
        form.parse(req, async (err, _fields, files) => {
            if (err) {
                console.error(err);
                return res.status(400).json({ error: "Upload failed" });
            }
            try {
                const targetDir = resolveServerPath(id, relPath);
                const filesObj = files;
                const fileList = Array.isArray(filesObj.file) ? filesObj.file : [filesObj.file].filter(Boolean);
                for (const f of fileList) {
                    const dest = path.join(targetDir, f.originalFilename || f.newFilename);
                    await fs.mkdir(path.dirname(dest), { recursive: true });
                    await fs.copyFile(f.filepath, dest);
                }
                res.json({ ok: true });
            }
            catch (e) {
                console.error(e);
                res.status(400).json({ error: "Upload failed" });
            }
        });
    });
    app.post("/api/v1/servers/:id/files/archive", requireAuth, async (req, res) => {
        const { id } = req.params;
        const relPath = String(req.body.path || "/");
        const archiveName = String(req.body.archiveName || "archive.zip");
        try {
            const src = resolveServerPath(id, relPath);
            const dest = resolveServerPath(id, path.join(path.dirname(relPath), archiveName));
            await fs.mkdir(path.dirname(dest), { recursive: true });
            const output = createWriteStream(dest);
            const archive = archiver("zip", { zlib: { level: 9 } });
            archive.directory(src, false);
            archive.pipe(output);
            await archive.finalize();
            res.json({ ok: true, path: path.relative(path.join(SERVERS_BASE, id), dest) });
        }
        catch (err) {
            console.error(err);
            res.status(400).json({ error: "Unable to create archive" });
        }
    });
    app.post("/api/v1/servers/:id/files/extract", requireAuth, async (req, res) => {
        const { id } = req.params;
        const relPath = String(req.body.path || "/");
        try {
            const src = resolveServerPath(id, relPath);
            const destDir = resolveServerPath(id, path.dirname(relPath));
            const unzipper = await import("unzipper");
            await createReadStream(src).pipe(unzipper.Extract({ path: destDir })).promise();
            res.json({ ok: true });
        }
        catch (err) {
            console.error(err);
            res.status(400).json({ error: "Unable to extract archive" });
        }
    });
}
