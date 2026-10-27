"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RecipeDetailModal } from "@/components/RecipeDetailModal";
import { RecipePreviewCard } from "@/components/RecipePreviewCard";
import { WarningBanner } from "@/components/WarningBanner";
import type { HistoryItem, Recipe } from "@/lib/types";

type OpenRecipe = { recipe: Recipe; generationId: string };

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<OpenRecipe | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
        if (!cancelled) setItems(data.items || []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Не удалось загрузить историю"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleFavorite(recipe: Recipe, generationId: string) {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe, sourceGenerationId: generationId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ошибка");
  }

  return (
    <div className="space-y-8">
      <section className="animate-rise max-w-2xl pt-4">
        <h1
          className="font-display text-4xl sm:text-5xl"
          style={{ color: "var(--ink)" }}
        >
          История
        </h1>
        <p className="mt-3" style={{ color: "var(--ink-muted)" }}>
          Недавние генерации в этой сессии браузера.
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
          <p className="font-display text-xl">Пока пусто</p>
          <p className="hint mt-2">
            Сгенерируйте первый рецепт на{" "}
            <Link href="/" style={{ color: "var(--accent)" }}>
              главной
            </Link>
            .
          </p>
        </div>
      )}

      <div className="space-y-10">
        {items.map((item) => (
          <section key={item.id} className="space-y-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                {new Date(item.createdAt).toLocaleString("ru-RU")}
                {item.demo ? " · демо" : ""}
              </p>
              <p className="hint mt-1">
                {item.input.ingredients.slice(0, 6).join(", ")}
                {item.input.ingredients.length > 6 ? "…" : ""}
              </p>
            </div>

            <WarningBanner warnings={item.warnings} />

            {item.recipes.length === 0 ? (
              <p className="hint">В этой генерации рецептов нет</p>
            ) : (
              <div className="recipe-preview-grid">
                {item.recipes.map((recipe, idx) => (
                  <RecipePreviewCard
                    key={recipe.id}
                    recipe={recipe}
                    index={idx}
                    onOpen={() =>
                      setOpen({ recipe, generationId: item.id })
                    }
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {open && (
        <RecipeDetailModal
          recipe={open.recipe}
          generationId={open.generationId}
          onClose={() => setOpen(null)}
          onFavorite={(r) => handleFavorite(r, open.generationId)}
        />
      )}
    </div>
  );
}
