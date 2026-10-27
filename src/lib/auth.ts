import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomUUID } from "crypto";
import { and, count, eq, gt, isNull, or } from "drizzle-orm";
import { cookies } from "next/headers";
import {
  activityLogs,
  authSessions,
  favorites,
  generations,
  users,
} from "@/lib/db/schema";
import { withDb } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { getOrCreateSessionId } from "@/lib/session";

const AUTH_COOKIE = "tasty_auth";
const SESSION_DAYS = 30;
const MAX_AGE = 60 * 60 * 24 * SESSION_DAYS;

export type UserRole = "user" | "admin";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type ActivityMeta = {
  ip?: string | null;
  userAgent?: string | null;
  location?: string | null;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

async function countAdmins(): Promise<number> {
  const rows = await withDb(async (db) => {
    return db
      .select({ value: count() })
      .from(users)
      .where(eq(users.role, "admin"));
  });
  return rows?.[0]?.value ?? 0;
}

async function resolveInitialRole(email: string): Promise<UserRole> {
  const bootstrap = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  if (bootstrap && bootstrap === email) return "admin";
  const admins = await countAdmins();
  if (admins === 0) return "admin";
  return "user";
}

export async function logActivity(
  userId: string,
  action: string,
  meta: ActivityMeta = {}
) {
  const now = new Date().toISOString();
  await withDb(async (db) => {
    await db.insert(activityLogs).values({
      id: randomUUID(),
      userId,
      action,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      location: meta.location ?? null,
      createdAt: now,
    });
    await db
      .update(users)
      .set({ lastActiveAt: now })
      .where(eq(users.id, userId));
  });
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  skipSession?: boolean;
  meta?: ActivityMeta;
}): Promise<{ user: PublicUser } | { error: string; status: number }> {
  const allowRegistration = await getSetting("allow_registration");
  if (allowRegistration === "false" && !input.role) {
    return { error: "Регистрация временно закрыта", status: 403 };
  }

  const maintenance = await getSetting("maintenance_mode");
  if (maintenance === "true" && !input.skipSession) {
    return { error: "Сайт на обслуживании. Попробуйте позже.", status: 503 };
  }

  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  const existing = await withDb(async (db) => {
    return db.select().from(users).where(eq(users.email, email)).limit(1);
  });

  if (existing && existing.length > 0) {
    return { error: "Этот email уже зарегистрирован", status: 409 };
  }

  const id = randomUUID();
  const passwordHash = await hashPassword(input.password);
  const role = input.role ?? (await resolveInitialRole(email));

  const created = await withDb(async (db) => {
    await db.insert(users).values({
      id,
      name,
      email,
      passwordHash,
      role,
      lastActiveAt: new Date().toISOString(),
    });
    return { id, name, email, role };
  });

  if (!created) {
    return {
      error: "Не удалось создать аккаунт. Проверьте базу данных.",
      status: 503,
    };
  }

  if (!input.skipSession) {
    await createAuthSession(created.id);
    await claimAnonymousData(created.id);
    await logActivity(created.id, "register", input.meta);
  }

  return { user: created };
}

export async function loginUser(input: {
  email: string;
  password: string;
  meta?: ActivityMeta;
}): Promise<{ user: PublicUser } | { error: string; status: number }> {
  const maintenance = await getSetting("maintenance_mode");
  const email = input.email.trim().toLowerCase();

  const rows = await withDb(async (db) => {
    return db.select().from(users).where(eq(users.email, email)).limit(1);
  });

  const user = rows?.[0];
  if (!user) {
    return { error: "Неверный email или пароль", status: 401 };
  }

  if (maintenance === "true" && user.role !== "admin") {
    return { error: "Сайт на обслуживании. Попробуйте позже.", status: 503 };
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    return { error: "Неверный email или пароль", status: 401 };
  }

  await createAuthSession(user.id);
  await claimAnonymousData(user.id);
  await logActivity(user.id, "login", input.meta);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: (user.role as UserRole) || "user",
    },
  };
}

async function createAuthSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + MAX_AGE * 1000).toISOString();

  const saved = await withDb(async (db) => {
    await db.insert(authSessions).values({
      id,
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    });
    return true;
  });

  if (!saved) {
    throw new Error("Failed to persist auth session");
  }

  const jar = await cookies();
  jar.set(AUTH_COOKIE, token, cookieOptions());
}

export async function logoutUser() {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (token) {
    await withDb(async (db) => {
      await db
        .delete(authSessions)
        .where(eq(authSessions.tokenHash, hashToken(token)));
    });
  }
  jar.set(AUTH_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const now = new Date().toISOString();
  const rows = await withDb(async (db) => {
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(authSessions)
      .innerJoin(users, eq(authSessions.userId, users.id))
      .where(
        and(
          eq(authSessions.tokenHash, hashToken(token)),
          gt(authSessions.expiresAt, now)
        )
      )
      .limit(1);
  });

  const row = rows?.[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: (row.role as UserRole) || "user",
  };
}

export async function requireAdmin(): Promise<
  PublicUser | { error: string; status: number }
> {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется авторизация", status: 401 };
  if (user.role !== "admin") return { error: "Forbidden", status: 403 };
  return user;
}

async function claimAnonymousData(userId: string) {
  const sessionId = await getOrCreateSessionId();

  await withDb(async (db) => {
    await db
      .update(generations)
      .set({ userId })
      .where(
        and(
          eq(generations.sessionId, sessionId),
          or(isNull(generations.userId), eq(generations.userId, ""))
        )
      );
    await db
      .update(favorites)
      .set({ userId })
      .where(
        and(
          eq(favorites.sessionId, sessionId),
          or(isNull(favorites.userId), eq(favorites.userId, ""))
        )
      );
  });
}

export function clientMetaFromHeaders(headers: Headers): ActivityMeta {
  const forwarded = headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    null;
  return {
    ip,
    userAgent: headers.get("user-agent"),
    location: headers.get("x-vercel-ip-city") || headers.get("cf-ipcity") || null,
  };
}
