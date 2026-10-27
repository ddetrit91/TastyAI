"use client";

import { useState } from "react";
import { LoadingState } from "@/components/LoadingState";
import { RecipeForm } from "@/components/RecipeForm";
import { RecipeResults } from "@/components/RecipeResults";
import type { GenerateInput, GenerateResult, Recipe } from "@/lib/types";

export function Generator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);

  async function handleSubmit(input: GenerateInput) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ошибка генерации");
      }
      setResult(data as GenerateResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось связаться с сервером"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleFavorite(recipe: Recipe) {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipe,
        sourceGenerationId: result?.generationId,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Ошибка сохранения");
    }
  }

  return (
    <div className="space-y-8">
      <RecipeForm loading={loading} onSubmit={handleSubmit} />

      {error && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm"
          style={{
            borderColor: "var(--danger)",
            color: "var(--danger)",
            background: "var(--surface)",
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      {loading && <LoadingState />}
      {!loading && result && (
        <RecipeResults result={result} onFavorite={handleFavorite} />
      )}
    </div>
  );
}
