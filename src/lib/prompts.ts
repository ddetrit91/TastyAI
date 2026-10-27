import { APPLIANCES, type GenerateInput } from "@/lib/types";

export function buildRecipePrompt(
  input: GenerateInput,
  safeIngredients: string[],
  preWarnings: string[]
): string {
  const applianceLabels = input.appliances
    .map((id) => APPLIANCES.find((a) => a.id === id)?.label ?? id)
    .join(", ");

  const modeRules =
    input.mode === "from_pantry"
      ? `Режим: готовить ТОЛЬКО из имеющихся продуктов.
- Не добавляй ингредиенты, которых нет у пользователя, кроме базовых (соль, перец, вода, растительное/сливочное масло) — помечай их kind: "basic".
- Дополнительные «по желанию при наличии» — kind: "optional", отдельно и явно.
- shoppingList не заполняй или оставь пустым.`
      : `Режим: можно предложить докупить немного продуктов для более сытного и вкусного блюда.
- Основные продукты пользователя — kind: "user".
- Базовые (соль, перец, вода, масло) — kind: "basic".
- Докупка — kind: "shopping" И продублируй названия в shoppingList (короткий список, 1–5 пунктов).`;

  const extras = [
    input.maxTimeMinutes
      ? `Максимальное время готовки: около ${input.maxTimeMinutes} минут.`
      : null,
    input.dietPreferences
      ? `Предпочтения в питании: ${input.dietPreferences}.`
      : null,
    input.targetCalories
      ? `Желаемая калорийность на порцию: около ${input.targetCalories} ккал (ориентир, не точное значение).`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `Ты — шеф-консультант TASTY AI. Отвечай ТОЛЬКО валидным JSON без markdown и без комментариев.

Задача: предложи 2 или 3 разных рецепта ужина на русском языке.

Доступные безопасные продукты пользователя:
${safeIngredients.map((i) => `- ${i}`).join("\n") || "(нет)"}

Доступная техника (используй ТОЛЬКО её; не предлагай духовку/микроволновку и т.д., если их нет):
${applianceLabels}

${modeRules}

${extras ? `Дополнительно:\n${extras}` : ""}

Уже известные предупреждения (включи их в warnings, не предлагай эти продукты):
${preWarnings.length ? preWarnings.map((w) => `- ${w}`).join("\n") : "- нет"}

Правила безопасности:
- Если продукт выглядит испорченным или опасным — предупреди в warnings и НЕ используй в рецепте.
- Не выдумывай точные калории: поле caloriesPerServingApproximate — приблизительная оценка.
- Шаги приготовления должны быть реализуемы с указанной техникой.
- Названия аппетитные, описания краткие.

Формат JSON строго:
{
  "warnings": string[],
  "recipes": [
    {
      "title": string,
      "description": string,
      "ingredients": [{ "name": string, "amount": string, "kind": "user"|"basic"|"optional"|"shopping" }],
      "steps": string[],
      "timeMinutes": number,
      "caloriesPerServingApproximate": number,
      "servings": number,
      "shoppingList": string[]
    }
  ]
}`;
}
