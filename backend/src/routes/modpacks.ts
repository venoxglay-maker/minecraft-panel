import type { Express, Request, Response } from "express";
import { requireAuth } from "../util/requireAuth.js";

const CURSEFORGE_API_KEY = process.env.CURSEFORGE_API_KEY || "";

export function registerModpackRoutes(app: Express) {
  app.get("/api/v1/modpacks/search", requireAuth, async (req: Request, res: Response) => {
    const provider = String(req.query.provider || "curseforge");
    const query = String(req.query.query || "");

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    if (provider !== "curseforge") {
      return res.status(400).json({ error: "Only curseforge provider is supported in MVP" });
    }

    if (!CURSEFORGE_API_KEY) {
      return res.status(500).json({ error: "CurseForge API key not configured" });
    }

    try {
      const url = new URL(
        "https://api.curseforge.com/v1/mods/search"
      );
      url.searchParams.set("gameId", "432"); // Minecraft
      url.searchParams.set("searchFilter", query);

      const resp = await fetch(url.toString(), {
        headers: {
          "x-api-key": CURSEFORGE_API_KEY,
          "Content-Type": "application/json"
        }
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error("CurseForge error", resp.status, text);
        return res.status(502).json({ error: "Failed to query CurseForge" });
      }

      const json = (await resp.json()) as any;
      const results = (json.data ?? []).map((m: any) => ({
        id: m.id,
        name: m.name,
        summary: m.summary,
        logoUrl: m.logo?.thumbnailUrl,
        slug: m.slug
      }));

      return res.json({ results });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to query modpacks" });
    }
  });
}

