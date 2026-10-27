import type { Recipe } from "@/lib/types";

export function formatRecipeText(recipe: Recipe): string {
  const ingredients = recipe.ingredients
    .map((i) => {
      const tag =
        i.kind === "basic"
          ? " (базовый)"
          : i.kind === "optional"
            ? " (по желанию)"
            : i.kind === "shopping"
              ? " (докупить)"
              : "";
      return `• ${i.name} — ${i.amount}${tag}`;
    })
    .join("\n");

  const steps = recipe.steps
    .map((step, idx) => `${idx + 1}. ${step}`)
    .join("\n");

  const shopping =
    recipe.shoppingList && recipe.shoppingList.length > 0
      ? `\n\nДокупить:\n${recipe.shoppingList.map((s) => `• ${s}`).join("\n")}`
      : "";

  return `${recipe.title}

${recipe.description}

Время: ~${recipe.timeMinutes} мин
Калорийность: ~${recipe.caloriesPerServingApproximate} ккал на порцию
Порций: ${recipe.servings}

Ингредиенты:
${ingredients}

Приготовление:
${steps}${shopping}

— TASTY AI`;
}
