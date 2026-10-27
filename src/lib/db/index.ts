import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/lib/db/schema";

type Db = LibSQLDatabase<typeof schema>;

let client: Client | null = null;
let db: Db | null = null;
let migrated = false;

export function isDbConfigured(): boolean {
  if (process.env.USE_LOCAL_DB === "0" && !process.env.TURSO_DATABASE_URL) {
    return false;
  }
  return true;
}

function getDatabaseUrl(): string {
  if (process.env.TURSO_DATABASE_URL?.trim()) {
    return process.env.TURSO_DATABASE_URL.trim();
  }
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim();
  }
  return "file:local.db";
}

function getClient(): Client {
  if (!client) {
    const url = getDatabaseUrl();
    const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
    client = createClient({
      url,
      authToken: authToken || undefined,
    });
  }
  return client;
}

export function getDb(): Db {
  if (!db) {
    db = drizzle(getClient(), { schema });
  }
  return db;
}

async function addColumnIfMissing(
  c: Client,
  table: string,
  column: string,
  definition: string
) {
  const info = await c.execute(`PRAGMA table_info(${table})`);
  const exists = info.rows.some((row) => String(row.name) === column);
  if (!exists) {
    await c.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export async function ensureSchema(): Promise<void> {
  if (migrated) return;
  const c = getClient();

  await c.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        last_active_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS auth_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS generations (
        id TEXT PRIMARY KEY NOT NULL,
        session_id TEXT NOT NULL,
        input_json TEXT NOT NULL,
        recipes_json TEXT NOT NULL,
        warnings_json TEXT NOT NULL DEFAULT '[]',
        demo INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS favorites (
        id TEXT PRIMARY KEY NOT NULL,
        session_id TEXT NOT NULL,
        title TEXT NOT NULL,
        recipe_json TEXT NOT NULL,
        source_generation_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        ip TEXT,
        user_agent TEXT,
        location TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_generations_session ON generations(session_id)`,
      `CREATE INDEX IF NOT EXISTS idx_favorites_session ON favorites(session_id)`,
      `CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at)`,
    ],
    "write"
  );

  await addColumnIfMissing(c, "generations", "user_id", "TEXT");
  await addColumnIfMissing(c, "favorites", "user_id", "TEXT");
  await addColumnIfMissing(c, "users", "role", "TEXT NOT NULL DEFAULT 'user'");
  await addColumnIfMissing(c, "users", "last_active_at", "TEXT");

  await c.batch(
    [
      `CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)`,
    ],
    "write"
  );

  // Default settings
  await c.execute(
    `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('allow_registration', 'true')`
  );
  await c.execute(
    `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('maintenance_mode', 'false')`
  );

  // Ensure at least one admin exists (oldest user)
  const adminCount = await c.execute(
    `SELECT COUNT(*) as c FROM users WHERE role = 'admin'`
  );
  const cVal = Number(adminCount.rows[0]?.c ?? 0);
  if (cVal === 0) {
    await c.execute(
      `UPDATE users SET role = 'admin' WHERE id = (
        SELECT id FROM users ORDER BY created_at ASC LIMIT 1
      )`
    );
  }

  migrated = true;
}

export async function withDb<T>(
  fn: (database: Db) => Promise<T>
): Promise<T | null> {
  if (!isDbConfigured()) {
    return null;
  }

  try {
    await ensureSchema();
    return await fn(getDb());
  } catch (error) {
    console.error("Database operation failed:", error);
    return null;
  }
}
