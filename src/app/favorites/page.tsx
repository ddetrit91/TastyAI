"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RecipeDetailModal } from "@/components/RecipeDetailModal";
import { RecipePreviewCard } from "@/components/RecipePreviewCard";
import type { FavoriteItem } from "@/lib/types";

export default function FavoritesPage() {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const openItem = items.find((x) => x.id === openId) ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/favorites");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
      setItems(data.items || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось загрузить избранное"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeFavorite(id: string) {
    const res = await fetch(`/api/favorites/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ошибка удаления");
    setItems((prev) => prev.filter((x) => x.id !== id));
    if (openId === id) setOpenId(null);
  }

  return (
    <div className="space-y-8">
      <section className="animate-rise max-w-2xl pt-4">
        <h1
          className="font-display text-4xl sm:text-5xl"
          style={{ color: "var(--ink)" }}
        >
          Избранное
        </h1>
        <p className="mt-3" style={{ color: "var(--ink-muted)" }}>
          Сохранённые рецепты, к которым можно вернуться.
        </p>
      </section>

      {loading && <p className="hint">Загрузка…</p>}
      {error && (
        <p style={{ color: "var(--danger)" }} className="text-sm">
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="panel rounded-[28px] px-6 py-10 text-center">
          <p className="font-display text-xl">Пока нет избранных</p>
          <p className="hint mt-2">
            Добавьте рецепт кнопкой «В избранное» на{" "}
            <Link href="/" style={{ color: "var(--accent)" }}>
              генераторе
            </Link>
            .
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="recipe-preview-grid">
          {items.map((item, idx) => (
            <RecipePreviewCard
              key={item.id}
              recipe={item.recipe}
              index={idx}
              onOpen={() => setOpenId(item.id)}
            />
          ))}
        </div>
      )}

      {openItem && (
        <RecipeDetailModal
          recipe={openItem.recipe}
          generationId={openItem.sourceGenerationId ?? undefined}
          favorited
          onClose={() => setOpenId(null)}
          onRemoveFavorite={() => removeFavorite(openItem.id)}
        />
      )}
    </div>
  );
}
