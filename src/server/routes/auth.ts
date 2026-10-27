import { Hono } from "hono";
import {
  clientMetaFromHeaders,
  createUser,
  getCurrentUser,
  loginUser,
  logoutUser,
} from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/auth-schemas";
import { statusOf } from "@/server/http";
import type { AppEnv } from "@/server/middleware";

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: "Проверьте данные формы",
        details: parsed.error.flatten().fieldErrors,
      },
      400
    );
  }

  const result = await createUser({
    ...parsed.data,
    meta: clientMetaFromHeaders(c.req.raw.headers),
  });
  if ("error" in result) {
    return c.json({ error: result.error }, statusOf(result.status));
  }
  return c.json({ user: result.user }, 201);
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: "Проверьте данные формы",
        details: parsed.error.flatten().fieldErrors,
      },
      400
    );
  }

  const result = await loginUser({
    ...parsed.data,
    meta: clientMetaFromHeaders(c.req.raw.headers),
  });
  if ("error" in result) {
    return c.json({ error: result.error }, statusOf(result.status));
  }
  return c.json({ user: result.user });
});

authRoutes.post("/logout", async (c) => {
  await logoutUser();
  return c.json({ ok: true });
});

authRoutes.get("/me", async (c) => {
  const user = await getCurrentUser();
  return c.json({ user });
});
