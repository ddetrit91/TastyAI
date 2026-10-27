"use client";

import { useState } from "react";
import { formatRecipeText } from "@/lib/copy-recipe";
import type { Recipe } from "@/lib/types";

interface RecipeCardProps {
  recipe: Recipe;
  generationId?: string;
  onFavorite?: (recipe: Recipe) => Promise<void> | void;
  favorited?: boolean;
  onRemoveFavorite?: () => Promise<void> | void;
  /** Inside modal: drop outer panel chrome */
  embedded?: boolean;
}

const kindLabel: Record<Recipe["ingredients"][number]["kind"], string> = {
  user: "",
  basic: "базовый",
  optional: "по желанию",
  shopping: "докупить",
};

export function RecipeCard({
  recipe,
  generationId,
  onFavorite,
  favorited,
  onRemoveFavorite,
  embedded = false,
}: RecipeCardProps) {
  const [copied, setCopied] = useState(false);
  const [favBusy, setFavBusy] = useState(false);
  const [favDone, setFavDone] = useState(Boolean(favorited));
  const [message, setMessage] = useState<string | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formatRecipeText(recipe));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage("Не удалось скопировать");
    }
  }

  async function handleFavorite() {
    if (!onFavorite || favBusy) return;
    setFavBusy(true);
    setMessage(null);
    try {
      await onFavorite(recipe);
      setFavDone(true);
    } catch {
      setMessage("Не удалось добавить в избранное");
    } finally {
      setFavBusy(false);
    }
  }

  async function handleRemove() {
    if (!onRemoveFavorite || favBusy) return;
    setFavBusy(true);
    try {
      await onRemoveFavorite();
      setFavDone(false);
    } finally {
      setFavBusy(false);
    }
  }

  return (
    <article
      className={
        embedded
          ? "overflow-hidden"
          : "panel animate-rise overflow-hidden rounded-[28px]"
      }
    >
      <div
        className={`border-b px-6 py-5 sm:px-8 ${embedded ? "pt-2" : ""}`}
        style={{
          borderColor: "var(--line)",
          background: embedded ? "transparent" : "var(--surface-2)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3
              className="font-display text-2xl text-balance sm:text-3xl"
              style={{ color: "var(--ink)" }}
            >
              {recipe.title}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
              {recipe.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={handleCopy}>
              {copied ? "Скопировано" : "Копировать"}
            </button>
            {onFavorite && !favDone && (
              <button
                type="button"
                className="btn-ghost"
                onClick={handleFavorite}
                disabled={favBusy}
                data-generation={generationId}
              >
                В избранное
              </button>
            )}
            {(favDone || favorited) && onRemoveFavorite && (
              <button
                type="button"
                className="btn-ghost"
                onClick={handleRemove}
                disabled={favBusy}
              >
                Убрать
              </button>
            )}
            {(favDone || favorited) && !onRemoveFavorite && (
              <span className="btn-ghost pointer-events-none opacity-80">В избранном</span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span
            className="rounded-full px-3 py-1"
            style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
          >
            ~{recipe.timeMinutes} мин
          </span>
          <span
            className="rounded-full px-3 py-1"
            style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
          >
            ~{recipe.caloriesPerServingApproximate} ккал / порция
          </span>
          <span
            className="rounded-full px-3 py-1"
            style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
          >
            {recipe.servings} порц.
          </span>
        </div>
        {message && (
          <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
            {message}
          </p>
        )}
      </div>

      <div className="grid gap-8 px-6 py-6 sm:grid-cols-2 sm:px-8">
        <section>
          <h4 className="mb-3 text-sm font-semibold tracking-wide" style={{ color: "var(--ink)" }}>
            Ингредиенты
          </h4>
          <ul className="space-y-2 text-sm">
            {recipe.ingredients.map((ing) => (
              <li key={`${ing.name}-${ing.amount}`} className="flex justify-between gap-3">
                <span>
                  {ing.name}
                  {kindLabel[ing.kind] ? (
                    <span className="hint"> · {kindLabel[ing.kind]}</span>
                  ) : null}
                </span>
                <span style={{ color: "var(--ink-muted)" }}>{ing.amount}</span>
              </li>
            ))}
          </ul>

          {recipe.shoppingList && recipe.shoppingList.length > 0 && (
            <div className="mt-5">
              <h4 className="mb-2 text-sm font-semibold" style={{ color: "var(--accent)" }}>
                Список докупки
              </h4>
              <ul className="space-y-1 text-sm" style={{ color: "var(--ink-muted)" }}>
                {recipe.shoppingList.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section>
          <h4 className="mb-3 text-sm font-semibold tracking-wide" style={{ color: "var(--ink)" }}>
            Приготовление
          </h4>
          <ol className="space-y-3 text-sm leading-relaxed">
            {recipe.steps.map((step, idx) => (
              <li key={step} className="flex gap-3">
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="hint mt-4">Калорийность указана ориентировочно.</p>
        </section>
      </div>
    </article>
  );
}
