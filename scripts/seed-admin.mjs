import bcrypt from "bcryptjs";
import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const email = (env.ADMIN_BOOTSTRAP_EMAIL || "admin@tasty.ai").toLowerCase();
const password = env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
if (!password || password.length < 8) {
  console.error(
    "Задайте ADMIN_BOOTSTRAP_PASSWORD в .env.local (не короче 8 символов), затем npm run seed:admin"
  );
  process.exit(1);
}
const name = "Admin";
const url = env.TURSO_DATABASE_URL || "file:local.db";
const authToken = env.TURSO_AUTH_TOKEN || undefined;

const client = createClient({ url, authToken });

await client.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    last_active_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

for (const sql of [
  `ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`,
  `ALTER TABLE users ADD COLUMN last_active_at TEXT`,
]) {
  try {
    await client.execute(sql);
  } catch {
    /* column may already exist */
  }
}

const hash = await bcrypt.hash(password, 12);
const existing = await client.execute({
  sql: "SELECT id FROM users WHERE email = ?",
  args: [email],
});

if (existing.rows.length) {
  await client.execute({
    sql: "UPDATE users SET password_hash = ?, role = 'admin', name = ? WHERE email = ?",
    args: [hash, name, email],
  });
  console.log("UPDATED", email);
} else {
  await client.execute({
    sql: `INSERT INTO users (id, name, email, password_hash, role, last_active_at, created_at)
          VALUES (?, ?, ?, ?, 'admin', datetime('now'), datetime('now'))`,
    args: [randomUUID(), name, email, hash],
  });
  console.log("CREATED", email);
}

const check = await client.execute({
  sql: "SELECT email, role FROM users WHERE email = ?",
  args: [email],
});
console.log(check.rows[0]);
