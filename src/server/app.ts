import { Hono } from "hono";
import { cors } from "hono/cors";
import { adminRoutes } from "@/server/routes/admin";
import { authRoutes } from "@/server/routes/auth";
import { recipeRoutes } from "@/server/routes/recipes";
import type { AppEnv } from "@/server/middleware";

const app = new Hono<AppEnv>().basePath("/api");

app.use("*", cors({ origin: (origin) => origin || "*", credentials: true }));

app.get("/health", (c) => c.json({ ok: true, engine: "hono" }));

app.route("/auth", authRoutes);
app.route("/admin", adminRoutes);
app.route("/", recipeRoutes);

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error("Hono error:", err);
  return c.json({ error: "Внутренняя ошибка сервера" }, 500);
});

export default app;
