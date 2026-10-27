import { Hono } from "hono";
import { z } from "zod";
import {
  adminCreateUser,
  adminDeleteUser,
  adminResetPassword,
  adminUpdateRole,
  getAdminSettings,
  getAdminStats,
  listActivity,
  listAdminUsers,
  updateAdminSettings,
} from "@/lib/adminService";
import { statusOf } from "@/server/http";
import { loadUser, requireAdmin, type AppEnv } from "@/server/middleware";

export const adminRoutes = new Hono<AppEnv>();

adminRoutes.use("*", loadUser, requireAdmin);

adminRoutes.get("/users", async (c) => {
  const users = await listAdminUsers();
  return c.json({ users });
});

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(120),
  password: z.string().min(6).max(72),
  role: z.enum(["user", "admin"]).default("user"),
});

adminRoutes.post("/users", async (c) => {
  const body = await c.req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: "Проверьте данные",
        details: parsed.error.flatten().fieldErrors,
      },
      400
    );
  }

  const result = await adminCreateUser(parsed.data);
  if ("error" in result) {
    return c.json({ error: result.error }, statusOf(result.status));
  }
  return c.json({ user: result.user }, 201);
});

const roleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

adminRoutes.put("/users/:id/role", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Некорректная роль" }, 400);
  }
  const result = await adminUpdateRole(id, parsed.data.role);
  if ("error" in result) {
    return c.json({ error: result.error }, statusOf(result.status));
  }
  return c.json({ ok: true });
});

const resetSchema = z.object({
  password: z.string().min(6).max(72),
});

adminRoutes.post("/users/:id/reset-password", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Пароль не короче 6 символов" }, 400);
  }
  const result = await adminResetPassword(id, parsed.data.password);
  if ("error" in result) {
    return c.json({ error: result.error }, statusOf(result.status));
  }
  return c.json({ ok: true });
});

adminRoutes.delete("/users/:id", async (c) => {
  const id = c.req.param("id");
  const admin = c.get("admin");
  const result = await adminDeleteUser(id, admin.id);
  if ("error" in result) {
    return c.json({ error: result.error }, statusOf(result.status));
  }
  return c.json({ ok: true });
});

adminRoutes.get("/stats", async (c) => {
  const stats = await getAdminStats();
  return c.json(stats);
});

adminRoutes.get("/activity", async (c) => {
  const items = await listActivity(80);
  return c.json({ items });
});

adminRoutes.get("/settings", async (c) => {
  const settings = await getAdminSettings();
  return c.json({ settings });
});

const settingsSchema = z.object({
  allow_registration: z.boolean().optional(),
  maintenance_mode: z.boolean().optional(),
});

adminRoutes.put("/settings", async (c) => {
  const body = await c.req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Некорректные настройки" }, 400);
  }
  const settings = await updateAdminSettings(parsed.data);
  return c.json({ settings });
});
