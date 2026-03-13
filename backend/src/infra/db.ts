import { Pool } from "pg";
import { runMigrations } from "./migrations.js";

export let pool: Pool;

export async function initDb() {
  const connectionString =
    process.env.DATABASE_URL ??
    `postgresql://${process.env.PGUSER || "mcpanel"}:${process.env.PGPASSWORD || "mcpanel_password"}@${
      process.env.PGHOST || "postgres"
    }:${process.env.PGPORT || "5432"}/${process.env.PGDATABASE || "mcpanel"}`;

  pool = new Pool({
    connectionString
  });

  await pool.query("SELECT 1");
  console.log("[DB] Connected");

  await runMigrations(pool);
}

