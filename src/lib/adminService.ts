import { randomUUID } from "crypto";
import { asc, count, desc, eq, gte, sql } from "drizzle-orm";
import {
  createUser,
  hashPassword,
  type PublicUser,
  type UserRole,
} from "@/lib/auth";
import { withDb } from "@/lib/db";
import {
  activityLogs,
  authSessions,
  favorites,
  generations,
  users,
} from "@/lib/db/schema";
import { getAllSettings, setSetting, type SettingKey } from "@/lib/settings";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  generationsCount: number;
  favoritesCount: number;
  createdAt: string;
  lastActiveAt: string | null;
};

export type DayBucket = { date: string; count: number };

export type AdminStats = {
  totalUsers: number;
  activeToday: number;
  generationsToday: number;
  registrationsByDay: DayBucket[];
  generationsByDay: DayBucket[];
};

export type ActivityRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  action: string;
  lastActiveAt: string;
  ip: string | null;
  location: string | null;
  userAgent: string | null;
};

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function lastNDays(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    days.push(dayKey(d));
  }
  return days;
}

function fillDays(days: string[], rows: { day: string; count: number }[]): DayBucket[] {
  const map = new Map(rows.map((r) => [r.day, r.count]));
  return days.map((date) => ({ date, count: map.get(date) ?? 0 }));
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const rows = await withDb(async (db) => {
    const all = await db.select().from(users).orderBy(desc(users.createdAt));
    const result: AdminUserRow[] = [];
    for (const u of all) {
      const gen = await db
        .select({ value: count() })
        .from(generations)
        .where(eq(generations.userId, u.id));
      const fav = await db
        .select({ value: count() })
        .from(favorites)
        .where(eq(favorites.userId, u.id));
      result.push({
        id: u.id,
        name: u.name,
        email: u.email,
        role: (u.role as UserRole) || "user",
        generationsCount: gen[0]?.value ?? 0,
        favoritesCount: fav[0]?.value ?? 0,
        createdAt: u.createdAt,
        lastActiveAt: u.lastActiveAt,
      });
    }
    return result;
  });
  return rows ?? [];
}

export async function adminCreateUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<{ user: PublicUser } | { error: string; status: number }> {
  if (input.password.length < 6) {
    return { error: "Пароль не короче 6 символов", status: 400 };
  }
  return createUser({
    name: input.name,
    email: input.email,
    password: input.password,
    role: input.role,
    skipSession: true,
  });
}

export async function adminUpdateRole(
  userId: string,
  role: UserRole
): Promise<{ ok: true } | { error: string; status: number }> {
  const target = await withDb(async (db) => {
    return db.select().from(users).where(eq(users.id, userId)).limit(1);
  });
  const user = target?.[0];
  if (!user) return { error: "Пользователь не найден", status: 404 };

  if (user.role === "admin" && role === "user") {
    const admins = await withDb(async (db) => {
      return db
        .select({ value: count() })
        .from(users)
        .where(eq(users.role, "admin"));
    });
    if ((admins?.[0]?.value ?? 0) <= 1) {
      return {
        error: "Нельзя снять роль с последнего администратора",
        status: 400,
      };
    }
  }

  await withDb(async (db) => {
    await db.update(users).set({ role }).where(eq(users.id, userId));
  });
  return { ok: true };
}

export async function adminResetPassword(
  userId: string,
  password: string
): Promise<{ ok: true } | { error: string; status: number }> {
  if (password.length < 6) {
    return { error: "Пароль не короче 6 символов", status: 400 };
  }
  const target = await withDb(async (db) => {
    return db.select().from(users).where(eq(users.id, userId)).limit(1);
  });
  if (!target?.[0]) return { error: "Пользователь не найден", status: 404 };

  const passwordHash = await hashPassword(password);
  await withDb(async (db) => {
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  });
  return { ok: true };
}

export async function adminDeleteUser(
  userId: string,
  actorId: string
): Promise<{ ok: true } | { error: string; status: number }> {
  if (userId === actorId) {
    return { error: "Нельзя удалить свой аккаунт", status: 400 };
  }

  const target = await withDb(async (db) => {
    return db.select().from(users).where(eq(users.id, userId)).limit(1);
  });
  const user = target?.[0];
  if (!user) return { error: "Пользователь не найден", status: 404 };

  if (user.role === "admin") {
    const admins = await withDb(async (db) => {
      return db
        .select({ value: count() })
        .from(users)
        .where(eq(users.role, "admin"));
    });
    if ((admins?.[0]?.value ?? 0) <= 1) {
      return {
        error: "Нельзя удалить последнего администратора",
        status: 400,
      };
    }
  }

  await withDb(async (db) => {
    await db.delete(authSessions).where(eq(authSessions.userId, userId));
    await db.delete(activityLogs).where(eq(activityLogs.userId, userId));
    await db.delete(favorites).where(eq(favorites.userId, userId));
    await db
      .update(generations)
      .set({ userId: null })
      .where(eq(generations.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  });

  return { ok: true };
}

export async function getAdminStats(): Promise<AdminStats> {
  const days = lastNDays(14);
  const start = `${days[0]}T00:00:00.000Z`;
  const todayStart = `${dayKey(new Date())}T00:00:00.000Z`;

  const result = await withDb(async (db) => {
    const totalUsers = (
      await db.select({ value: count() }).from(users)
    )[0]?.value ?? 0;

    const activeToday = (
      await db
        .select({ value: count() })
        .from(users)
        .where(gte(users.lastActiveAt, todayStart))
    )[0]?.value ?? 0;

    const generationsToday = (
      await db
        .select({ value: count() })
        .from(generations)
        .where(gte(generations.createdAt, todayStart))
    )[0]?.value ?? 0;

    const regRows = await db
      .select({
        day: sql<string>`substr(${users.createdAt}, 1, 10)`,
        count: count(),
      })
      .from(users)
      .where(gte(users.createdAt, start))
      .groupBy(sql`substr(${users.createdAt}, 1, 10)`)
      .orderBy(asc(sql`substr(${users.createdAt}, 1, 10)`));

    const genRows = await db
      .select({
        day: sql<string>`substr(${generations.createdAt}, 1, 10)`,
        count: count(),
      })
      .from(generations)
      .where(gte(generations.createdAt, start))
      .groupBy(sql`substr(${generations.createdAt}, 1, 10)`)
      .orderBy(asc(sql`substr(${generations.createdAt}, 1, 10)`));

    return {
      totalUsers,
      activeToday,
      generationsToday,
      registrationsByDay: fillDays(
        days,
        regRows.map((r) => ({ day: r.day, count: Number(r.count) }))
      ),
      generationsByDay: fillDays(
        days,
        genRows.map((r) => ({ day: r.day, count: Number(r.count) }))
      ),
    };
  });

  return (
    result ?? {
      totalUsers: 0,
      activeToday: 0,
      generationsToday: 0,
      registrationsByDay: fillDays(days, []),
      generationsByDay: fillDays(days, []),
    }
  );
}

export async function listActivity(limit = 50): Promise<ActivityRow[]> {
  const rows = await withDb(async (db) => {
    return db
      .select({
        id: activityLogs.id,
        userId: activityLogs.userId,
        name: users.name,
        email: users.email,
        role: users.role,
        action: activityLogs.action,
        lastActiveAt: activityLogs.createdAt,
        ip: activityLogs.ip,
        location: activityLogs.location,
        userAgent: activityLogs.userAgent,
      })
      .from(activityLogs)
      .innerJoin(users, eq(activityLogs.userId, users.id))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  });

  return (rows ?? []).map((r) => ({
    ...r,
    role: (r.role as UserRole) || "user",
  }));
}

export async function getAdminSettings() {
  return getAllSettings();
}

export async function updateAdminSettings(
  patch: Partial<Record<SettingKey, boolean>>
) {
  for (const [key, value] of Object.entries(patch) as [SettingKey, boolean][]) {
    if (typeof value === "boolean") {
      await setSetting(key, value);
    }
  }
  return getAllSettings();
}

export { randomUUID };
