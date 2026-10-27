import { randomUUID } from "crypto";
import type { GenerateInput, GenerateResult, Recipe } from "@/lib/types";
import { detectUnsafeIngredients } from "@/lib/safety";

function baseRecipes(
  ingredients: string[],
  appliances: GenerateInput["appliances"],
  mode: GenerateInput["mode"]
): Recipe[] {
  const highlight = ingredients.slice(0, 3).join(", ") || "овощи";
  const hasMicrowave = appliances.includes("microwave");
  const hasOven = appliances.includes("oven");
  const hasStove = appliances.includes("stove") || appliances.includes("multicooker");
  const cookVerb = hasStove
    ? "обжарьте на плите"
    : hasOven
      ? "запеките в духовке"
      : hasMicrowave
        ? "подогрейте в микроволновке"
        : "аккуратно соедините и дайте настояться";

  const shopping =
    mode === "with_shopping"
      ? ["сливки 10%", "твёрдый сыр", "свежая зелень"]
      : undefined;

  const recipes: Recipe[] = [
    {
      id: randomUUID(),
      title: `Вечерний скрэмбл с ${ingredients[0] ?? "овощами"}`,
      description: `Быстрое тёплое блюдо на основе того, что уже есть: ${highlight}.`,
      ingredients: [
        ...ingredients.slice(0, 5).map((name) => ({
          name,
          amount: "по наличию",
          kind: "user" as const,
        })),
        { name: "соль", amount: "по вкусу", kind: "basic" },
        { name: "растительное масло", amount: "1 ст. л.", kind: "basic" },
        ...(mode === "with_shopping"
          ? [
              {
                name: "сливки 10%",
                amount: "50 мл",
                kind: "shopping" as const,
              },
            ]
          : []),
      ],
      steps: [
        "Подготовьте продукты: промойте, нарежьте удобными кусочками.",
        `На доступной технике ${cookVerb} основу блюда 5–8 минут.`,
        "Добавьте остальные ингредиенты, посолите, доведите до готовности.",
        "Разложите по тарелкам и подайте тёплым.",
      ],
      timeMinutes: 20,
      caloriesPerServingApproximate: 380,
      servings: 2,
      shoppingList: shopping,
    },
    {
      id: randomUUID(),
      title: `Тёплая миска «Домашний ужин»`,
      description:
        "Сбалансированная миска: текстуры, тепло и простая сборка без лишней посуды.",
      ingredients: [
        ...ingredients.slice(0, 6).map((name) => ({
          name,
          amount: "по наличию",
          kind: "user" as const,
        })),
        { name: "перец", amount: "щепотка", kind: "basic" },
        { name: "вода", amount: "50–100 мл", kind: "basic" },
        ...(mode === "with_shopping"
          ? [
              {
                name: "твёрдый сыр",
                amount: "40 г",
                kind: "shopping" as const,
              },
            ]
          : [
              {
                name: "любимые специи",
                amount: "по желанию",
                kind: "optional" as const,
              },
            ]),
      ],
      steps: [
        "Соберите основу из крупяных/овощных продуктов.",
        hasOven
          ? "При желании подрумяньте часть ингредиентов в духовке 10–12 минут при 180°C."
          : hasMicrowave
            ? "Прогрейте основу в микроволновке 2–3 минуты, помешивая."
            : "Прогрейте основу на плите или в мультиварке до горячего состояния.",
        "Смешайте, приправьте, добавьте опциональные продукты при наличии.",
        "Подайте сразу, пока блюдо тёплое.",
      ],
      timeMinutes: 25,
      caloriesPerServingApproximate: 420,
      servings: 2,
      shoppingList: shopping,
    },
  ];

  if (ingredients.length >= 2) {
    recipes.push({
      id: randomUUID(),
      title: `Ароматный дуэт: ${ingredients[0]} и ${ingredients[1]}`,
      description:
        "Минималистичный рецепт, где два главных продукта задают вкус всего ужина.",
      ingredients: [
        {
          name: ingredients[0],
          amount: "основная порция",
          kind: "user",
        },
        {
          name: ingredients[1],
          amount: "к основе",
          kind: "user",
        },
        ...ingredients.slice(2, 4).map((name) => ({
          name,
          amount: "по вкусу",
          kind: "user" as const,
        })),
        { name: "масло", amount: "1 ч. л.", kind: "basic" },
      ],
      steps: [
        "Соедините два ключевых продукта в одной посуде.",
        `${cookVerb.charAt(0).toUpperCase()}${cookVerb.slice(1)} до мягкости и аппетитного аромата.`,
        "Доведите вкус солью и перцем, при необходимости добавьте немного воды.",
        "Подайте с остальными продуктами как гарнир или топпинг.",
      ],
      timeMinutes: 18,
      caloriesPerServingApproximate: 350,
      servings: 2,
      shoppingList: mode === "with_shopping" ? ["свежая зелень"] : undefined,
    });
  }

  return recipes;
}

export function buildDemoResult(input: GenerateInput): GenerateResult {
  const { safe, warnings } = detectUnsafeIngredients(input.ingredients);

  if (safe.length === 0) {
    return {
      recipes: [],
      warnings,
      demo: true,
    };
  }

  return {
    recipes: baseRecipes(safe, input.appliances, input.mode),
    warnings,
    demo: true,
  };
}
