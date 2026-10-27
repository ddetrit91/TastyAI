"use client";

import Image from "next/image";
import { Clock, Flame } from "lucide-react";
import { getRecipeVisual, teaserText } from "@/lib/recipe-visual";
import type { Recipe } from "@/lib/types";

interface RecipePreviewCardProps {
  recipe: Recipe;
  index: number;
  onOpen: () => void;
}

export function RecipePreviewCard({ recipe, index, onOpen }: RecipePreviewCardProps) {
  const visual = getRecipeVisual(recipe);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="recipe-preview group text-left animate-rise"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="recipe-preview__media">
        <Image
          src={visual.src}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="recipe-preview__shade" />
      </div>

      <div className="recipe-preview__body">
        <p className="recipe-preview__mood">{visual.label}</p>
        <h3 className="mt-1 font-display text-xl font-bold leading-tight tracking-tight sm:text-[1.35rem]">
          {recipe.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
          {teaserText(recipe.description)}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="recipe-preview__meta">
            <Clock className="h-3.5 w-3.5" />~{recipe.timeMinutes} мин
          </span>
          <span className="recipe-preview__meta">
            <Flame className="h-3.5 w-3.5" />~
            {recipe.caloriesPerServingApproximate} ккал
          </span>
        </div>

        <span className="recipe-preview__cta mt-4 inline-flex text-sm font-semibold" style={{ color: "var(--accent)" }}>
          Открыть рецепт
        </span>
      </div>
    </button>
  );
}
