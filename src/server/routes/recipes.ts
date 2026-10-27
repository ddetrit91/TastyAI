import { Hono } from "hono";
import { z } from "zod";
import {
  clientMetaFromHeaders,
  logActivity,
  requireUser,
} from "@/lib/auth";
import { statusOf } from "@/server/http";
import { generateRecipes } from "@/lib/gemini";
import { generateInputSchema, recipeSchema } from "@/lib/schemas";
import { getSetting } from "@/lib/settings";
import { getOrCreateSessionId } from "@/lib/session";
import {
  addFavorite,
  listFavorites,
  listHistory,
  removeFavorite,
  saveGeneration,
} from "@/lib/store";
import type { AppEnv } from "@/server/middleware";

export const recipeRoutes = new Hono<AppEnv>();

recipeRoutes.post("/recipes/generate", async (c) => {
  const auth = await requireUser();
  if ("error" in auth) {
    return c.json({ error: auth.error }, statusOf(auth.status));
  }
  const user = auth;

  const maintenance = await getSetting("maintenance_mode");
  if (maintenance === "true" && user.role !== "admin") {
    return c.json({ error: "Сайт на обслуживании" }, 503);
  }

  const body = await c.req.json();
  const parsed = generateInputSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: "Некорректные данные формы",
        details: parsed.error.flatten().fieldErrors,
      },
      400
    );
  }

  const result = await generateRecipes(parsed.data);
  const sessionId = await getOrCreateSessionId();
  const generationId = await saveGeneration(
    sessionId,
    parsed.data,
    result,
    user.id
  );

  await logActivity(user.id, "generate", clientMetaFromHeaders(c.req.raw.headers));

  return c.json({ ...result, generationId });
});

recipeRoutes.get("/history", async (c) => {
  const auth = await requireUser();
  if ("error" in auth) {
    return c.json({ error: auth.error }, statusOf(auth.status));
  }
  const sessionId = await getOrCreateSessionId();
  const items = await listHistory(sessionId, auth.id);
  return c.json({ items });
});

recipeRoutes.get("/favorites", async (c) => {
  const auth = await requireUser();
  if ("error" in auth) {
    return c.json({ error: auth.error }, statusOf(auth.status));
  }
  const sessionId = await getOrCreateSessionId();
  const items = await listFavorites(sessionId, auth.id);
  return c.json({ items });
});

const favoriteBody = z.object({
  recipe: recipeSchema,
  sourceGenerationId: z.string().optional(),
});

recipeRoutes.post("/favorites", async (c) => {
  const auth = await requireUser();
  if ("error" in auth) {
    return c.json({ error: auth.error }, statusOf(auth.status));
  }

  const body = await c.req.json();
  const parsed = favoriteBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Некорректные данные рецепта" }, 400);
  }

  const sessionId = await getOrCreateSessionId();
  const user = auth;
  const recipe = {
    ...parsed.data.recipe,
    id: parsed.data.recipe.id || crypto.randomUUID(),
  };
  const item = await addFavorite(
    sessionId,
    recipe,
    parsed.data.sourceGenerationId,
    user?.id
  );

  if (!item) {
    return c.json(
      {
        error:
          "Не удалось сохранить в избранное. Проверьте подключение к базе.",
      },
      503
    );
  }

  return c.json({ item }, 201);
});

recipeRoutes.delete("/favorites/:id", async (c) => {
  const auth = await requireUser();
  if ("error" in auth) {
    return c.json({ error: auth.error }, statusOf(auth.status));
  }

  const id = c.req.param("id");
  const sessionId = await getOrCreateSessionId();
  const user = auth;
  const ok = await removeFavorite(sessionId, id, user?.id);
  if (!ok) {
    return c.json({ error: "Рецепт не найден в избранном" }, 404);
  }
  return c.json({ ok: true });
});
