"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { RecipeCard } from "@/components/RecipeCard";
import { getRecipeVisual } from "@/lib/recipe-visual";
import type { Recipe } from "@/lib/types";

interface RecipeDetailModalProps {
  recipe: Recipe;
  generationId?: string;
  onClose: () => void;
  onFavorite?: (recipe: Recipe) => Promise<void> | void;
  favorited?: boolean;
  onRemoveFavorite?: () => Promise<void> | void;
}

export function RecipeDetailModal({
  recipe,
  generationId,
  onClose,
  onFavorite,
  favorited,
  onRemoveFavorite,
}: RecipeDetailModalProps) {
  const visual = getRecipeVisual(recipe);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="recipe-modal" role="dialog" aria-modal="true" aria-label={recipe.title}>
      <button type="button" className="recipe-modal__backdrop" aria-label="Закрыть" onClick={onClose} />
      <div className="recipe-modal__panel animate-rise">
        <div className="recipe-modal__hero">
          <Image
            src={visual.src}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            className="object-cover"
            priority
          />
          <div className="recipe-modal__hero-shade" />
          <button type="button" className="recipe-modal__close" onClick={onClose} aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="recipe-modal__scroll">
          <RecipeCard
            recipe={recipe}
            generationId={generationId}
            onFavorite={onFavorite}
            favorited={favorited}
            onRemoveFavorite={onRemoveFavorite}
            embedded
          />
        </div>
      </div>
    </div>
  );
}
