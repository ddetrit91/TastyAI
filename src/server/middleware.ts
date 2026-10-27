import { createMiddleware } from "hono/factory";
import { getCurrentUser, type PublicUser } from "@/lib/auth";

export type AppEnv = {
  Variables: {
    user: PublicUser | null;
    admin: PublicUser;
  };
};

export const loadUser = createMiddleware<AppEnv>(async (c, next) => {
  const user = await getCurrentUser();
  c.set("user", user);
  await next();
});

export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const user = c.get("user") ?? (await getCurrentUser());
  if (!user) {
    return c.json({ error: "Требуется авторизация" }, 401);
  }
  if (user.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }
  c.set("admin", user);
  await next();
});
