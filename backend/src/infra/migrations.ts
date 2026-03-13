import type { Pool } from "pg";

type Migration = {
  id: string;
  up: string;
};

// Simple, linear SQL migration system. In a real project we could swap this
// for drizzle/knex without changing callers.
const migrations: Migration[] = [
  {
    id: "001_init_core_schema",
    up: `
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'owner',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      refresh_token_hash TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS servers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      minecraft_version TEXT NOT NULL,
      java_version TEXT NOT NULL,
      ram_mb INTEGER NOT NULL,
      port INTEGER,
      install_state TEXT NOT NULL DEFAULT 'creating',
      power_state TEXT NOT NULL DEFAULT 'offline',
      modpack_id UUID,
      world_profile_id UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS server_runtime_state (
      server_id UUID PRIMARY KEY REFERENCES servers(id) ON DELETE CASCADE,
      online_players INTEGER NOT NULL DEFAULT 0,
      max_players INTEGER,
      tps NUMERIC(5,2),
      cpu_percent NUMERIC(5,2),
      memory_mb_used INTEGER,
      disk_mb_used INTEGER,
      last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS server_backups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      size_mb INTEGER,
      location TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'manual',
      status TEXT NOT NULL DEFAULT 'completed'
    );

    CREATE TABLE IF NOT EXISTS server_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      level TEXT NOT NULL DEFAULT 'info',
      message TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_server_permissions (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
      permissions JSONB NOT NULL,
      PRIMARY KEY (user_id, server_id)
    );

    CREATE TABLE IF NOT EXISTS modpacks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      provider TEXT NOT NULL,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      data_json JSONB NOT NULL DEFAULT '{}'::jsonb
    );

    CREATE TABLE IF NOT EXISTS server_modpacks (
      server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
      modpack_id UUID NOT NULL REFERENCES modpacks(id) ON DELETE CASCADE,
      installed_version TEXT,
      status TEXT NOT NULL DEFAULT 'installed',
      PRIMARY KEY (server_id, modpack_id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ,
      meta_json JSONB NOT NULL DEFAULT '{}'::jsonb
    );
    `
  }
];

export async function runMigrations(pool: Pool) {
  // Ensure schema_migrations exists before anything else
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const appliedResult = await pool.query<{ id: string }>("SELECT id FROM schema_migrations");
  const applied = new Set(appliedResult.rows.map((r: { id: string }) => r.id));

  for (const migration of migrations) {
    if (applied.has(migration.id)) {
      continue;
    }
    console.log("[DB] Applying migration", migration.id);
    await pool.query("BEGIN");
    try {
      await pool.query(migration.up);
      await pool.query("INSERT INTO schema_migrations (id) VALUES ($1)", [migration.id]);
      await pool.query("COMMIT");
      console.log("[DB] Migration applied", migration.id);
    } catch (err) {
      await pool.query("ROLLBACK");
      console.error("[DB] Migration failed", migration.id, err);
      throw err;
    }
  }
}

