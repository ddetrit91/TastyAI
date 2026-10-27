import { desc, eq, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import { favorites, generations } from "@/lib/db/schema";
import { withDb } from "@/lib/db";
import type {
  FavoriteItem,
  GenerateInput,
  GenerateResult,
  HistoryItem,
  Recipe,
} from "@/lib/types";

export async function saveGeneration(
  sessionId: string,
  input: GenerateInput,
  result: GenerateResult,
  userId?: string | null
): Promise<string | undefined> {
  const id = randomUUID();
  const saved = await withDb(async (db) => {
    await db.insert(generations).values({
      id,
      sessionId,
      userId: userId ?? null,
      inputJson: JSON.stringify(input),
      recipesJson: JSON.stringify(result.recipes),
      warningsJson: JSON.stringify(result.warnings),
      demo: result.demo,
    });
    return id;
  });
  return saved ?? undefined;
}

export async function listHistory(
  sessionId: string,
  userId?: string | null,
  limit = 30
): Promise<HistoryItem[]> {
  const rows = await withDb(async (db) => {
    const where = userId
      ? or(eq(generations.userId, userId), eq(generations.sessionId, sessionId))
      : eq(generations.sessionId, sessionId);

    return db
      .select()
      .from(generations)
      .where(where)
      .orderBy(desc(generations.createdAt))
      .limit(limit);
  });

  if (!rows) return [];

  // Dedupe by id (user + session overlap)
  const seen = new Set<string>();
  return rows
    .filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    })
    .map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      input: JSON.parse(row.inputJson) as GenerateInput,
      recipes: JSON.parse(row.recipesJson) as Recipe[],
      warnings: JSON.parse(row.warningsJson) as string[],
      demo: row.demo,
    }));
}

export async function addFavorite(
  sessionId: string,
  recipe: Recipe,
  sourceGenerationId?: string,
  userId?: string | null
): Promise<FavoriteItem | null> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const item: FavoriteItem = {
    id,
    title: recipe.title,
    recipe,
    createdAt,
    sourceGenerationId: sourceGenerationId ?? null,
  };

  const saved = await withDb(async (db) => {
    await db.insert(favorites).values({
      id,
      sessionId,
      userId: userId ?? null,
      title: recipe.title,
      recipeJson: JSON.stringify(recipe),
      sourceGenerationId: sourceGenerationId ?? null,
      createdAt,
    });
    return item;
  });

  return saved;
}

export async function listFavorites(
  sessionId: string,
  userId?: string | null
): Promise<FavoriteItem[]> {
  const rows = await withDb(async (db) => {
    const where = userId
      ? or(eq(favorites.userId, userId), eq(favorites.sessionId, sessionId))
      : eq(favorites.sessionId, sessionId);

    return db
      .select()
      .from(favorites)
      .where(where)
      .orderBy(desc(favorites.createdAt));
  });

  if (!rows) return [];

  const seen = new Set<string>();
  return rows
    .filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    })
    .map((row) => ({
      id: row.id,
      title: row.title,
      recipe: JSON.parse(row.recipeJson) as Recipe,
      createdAt: row.createdAt,
      sourceGenerationId: row.sourceGenerationId,
    }));
}

export async function removeFavorite(
  sessionId: string,
  id: string,
  userId?: string | null
): Promise<boolean> {
  const result = await withDb(async (db) => {
    const existing = await db
      .select()
      .from(favorites)
      .where(eq(favorites.id, id))
      .limit(1);
    const row = existing[0];
    if (!row) return false;

    const owns =
      row.sessionId === sessionId ||
      (userId && row.userId === userId);
    if (!owns) return false;

    await db.delete(favorites).where(eq(favorites.id, id));
    return true;
  });
  return Boolean(result);
}
