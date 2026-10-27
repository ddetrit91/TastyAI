"use client";

import { useMemo, useState } from "react";
import { APPLIANCES, type ApplianceId, type CookingMode, type GenerateInput } from "@/lib/types";

interface RecipeFormProps {
  loading: boolean;
  onSubmit: (input: GenerateInput) => void;
}

function parseIngredients(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function RecipeForm({ loading, onSubmit }: RecipeFormProps) {
  const [ingredientsRaw, setIngredientsRaw] = useState("");
  const [appliances, setAppliances] = useState<ApplianceId[]>(["stove"]);
  const [mode, setMode] = useState<CookingMode>("from_pantry");
  const [maxTimeMinutes, setMaxTimeMinutes] = useState("");
  const [dietPreferences, setDietPreferences] = useState("");
  const [targetCalories, setTargetCalories] = useState("");
  const [error, setError] = useState<string | null>(null);

  const ingredientCount = useMemo(
    () => parseIngredients(ingredientsRaw).length,
    [ingredientsRaw]
  );

  function toggleAppliance(id: ApplianceId) {
    setAppliances((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const ingredients = parseIngredients(ingredientsRaw);
    if (ingredients.length === 0) {
      setError("Укажите хотя бы один продукт");
      return;
    }
    if (appliances.length === 0) {
      setError("Выберите хотя бы одну кухонную технику");
      return;
    }

    const input: GenerateInput = {
      ingredients,
      appliances,
      mode,
    };

    if (maxTimeMinutes) {
      const n = Number(maxTimeMinutes);
      if (!Number.isFinite(n) || n < 5 || n > 480) {
        setError("Время: от 5 до 480 минут");
        return;
      }
      input.maxTimeMinutes = n;
    }

    if (dietPreferences.trim()) {
      input.dietPreferences = dietPreferences.trim();
    }

    if (targetCalories) {
      const n = Number(targetCalories);
      if (!Number.isFinite(n) || n < 100 || n > 2500) {
        setError("Калорийность: от 100 до 2500 ккал");
        return;
      }
      input.targetCalories = n;
    }

    onSubmit(input);
  }

  return (
    <form onSubmit={handleSubmit} className="panel animate-rise rounded-[28px] p-6 sm:p-8">
      <div className="mb-6">
        <label htmlFor="ingredients" className="label">
          Что есть дома
        </label>
        <textarea
          id="ingredients"
          className="field min-h-[120px] resize-y"
          placeholder="Например: яйца, картофель, сыр, помидоры&#10;Можно через запятую или с новой строки"
          value={ingredientsRaw}
          onChange={(e) => setIngredientsRaw(e.target.value)}
          disabled={loading}
        />
        <p className="hint mt-2">Продуктов: {ingredientCount}</p>
      </div>

      <fieldset className="mb-6">
        <legend className="label">Кухонная техника</legend>
        <div className="flex flex-wrap gap-2">
          {APPLIANCES.map((a) => {
            const on = appliances.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                disabled={loading}
                onClick={() => toggleAppliance(a.id)}
                className="rounded-full px-4 py-2 text-sm transition"
                style={{
                  background: on ? "var(--accent)" : "var(--surface-2)",
                  color: on ? "#fffaf3" : "var(--ink)",
                  border: `1px solid ${on ? "var(--accent)" : "var(--line)"}`,
                }}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mb-6">
        <legend className="label">Как готовим</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label
            className="cursor-pointer rounded-2xl p-4 transition"
            style={{
              border: `1px solid ${mode === "from_pantry" ? "var(--accent)" : "var(--line)"}`,
              background:
                mode === "from_pantry" ? "var(--accent-soft)" : "var(--surface)",
            }}
          >
            <input
              type="radio"
              name="mode"
              className="sr-only"
              checked={mode === "from_pantry"}
              onChange={() => setMode("from_pantry")}
              disabled={loading}
            />
            <span className="block text-sm font-semibold">Только из имеющегося</span>
            <span className="hint mt-1 block">
              Без обязательной докупки — базовые продукты (соль, масло) допустимы
            </span>
          </label>
          <label
            className="cursor-pointer rounded-2xl p-4 transition"
            style={{
              border: `1px solid ${mode === "with_shopping" ? "var(--accent)" : "var(--line)"}`,
              background:
                mode === "with_shopping" ? "var(--accent-soft)" : "var(--surface)",
            }}
          >
            <input
              type="radio"
              name="mode"
              className="sr-only"
              checked={mode === "with_shopping"}
              onChange={() => setMode("with_shopping")}
              disabled={loading}
            />
            <span className="block text-sm font-semibold">Можно докупить</span>
            <span className="hint mt-1 block">
              Более сытное блюдо + короткий список покупок
            </span>
          </label>
        </div>
      </fieldset>

      <details className="mb-6 rounded-2xl border p-4" style={{ borderColor: "var(--line)" }}>
        <summary className="cursor-pointer text-sm font-medium" style={{ color: "var(--ink-muted)" }}>
          Дополнительные пожелания (необязательно)
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="time" className="label">
              Время, мин
            </label>
            <input
              id="time"
              type="number"
              min={5}
              max={480}
              className="field"
              value={maxTimeMinutes}
              onChange={(e) => setMaxTimeMinutes(e.target.value)}
              disabled={loading}
              placeholder="30"
            />
          </div>
          <div>
            <label htmlFor="kcal" className="label">
              ~ккал на порцию
            </label>
            <input
              id="kcal"
              type="number"
              min={100}
              max={2500}
              className="field"
              value={targetCalories}
              onChange={(e) => setTargetCalories(e.target.value)}
              disabled={loading}
              placeholder="500"
            />
          </div>
          <div className="sm:col-span-1">
            <label htmlFor="diet" className="label">
              Питание
            </label>
            <input
              id="diet"
              className="field"
              value={dietPreferences}
              onChange={(e) => setDietPreferences(e.target.value)}
              disabled={loading}
              placeholder="без мяса, остро"
            />
          </div>
        </div>
      </details>

      {error && (
        <p className="mb-4 text-sm" style={{ color: "var(--danger)" }} role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={loading}>
        {loading ? "Готовим идеи…" : "Сгенерировать рецепты"}
      </button>
    </form>
  );
}
