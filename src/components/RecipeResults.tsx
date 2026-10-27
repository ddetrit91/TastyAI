"use client";

import { useState } from "react";
import { RecipeDetailModal } from "@/components/RecipeDetailModal";
import { RecipePreviewCard } from "@/components/RecipePreviewCard";
import { WarningBanner } from "@/components/WarningBanner";
import type { GenerateResult, Recipe } from "@/lib/types";

interface RecipeResultsProps {
  result: GenerateResult;
  onFavorite: (recipe: Recipe) => Promise<void>;
}

export function RecipeResults({ result, onFavorite }: RecipeResultsProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openRecipe = result.recipes.find((r) => r.id === openId) ?? null;

  if (result.recipes.length === 0) {
    return (
      <div className="space-y-4">
        <WarningBanner warnings={result.warnings} />
        <div className="panel rounded-[28px] px-6 py-10 text-center">
          <p className="font-display text-xl">Рецептов нет</p>
          <p className="hint mt-2">
            Добавьте безопасные продукты или измените запрос.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {result.demo && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm"
          style={{
            borderColor: "var(--line)",
            background: "var(--surface)",
            color: "var(--ink-muted)",
          }}
        >
          Демо-режим: Gemini API не настроен или недоступен. Показаны примерные
          рецепты. Добавьте <code>GEMINI_API_KEY</code> в{" "}
          <code>.env.local</code> для живой генерации.
        </div>
      )}

      <WarningBanner warnings={result.warnings} />

      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Варианты блюд
          </h2>
          <p className="hint mt-1">
            Выберите карточку — откроется полный рецепт
          </p>
        </div>
        <span className="hint shrink-0 text-sm">
          {result.recipes.length}{" "}
          {result.recipes.length === 1
            ? "рецепт"
            : result.recipes.length < 5
              ? "рецепта"
              : "рецептов"}
        </span>
      </div>

      <div className="recipe-preview-grid">
        {result.recipes.map((recipe, idx) => (
          <RecipePreviewCard
            key={recipe.id}
            recipe={recipe}
            index={idx}
            onOpen={() => setOpenId(recipe.id)}
          />
        ))}
      </div>

      {openRecipe && (
        <RecipeDetailModal
          recipe={openRecipe}
          generationId={result.generationId}
          onClose={() => setOpenId(null)}
          onFavorite={onFavorite}
        />
      )}
    </div>
  );
}
