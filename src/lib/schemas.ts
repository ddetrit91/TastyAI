import { z } from "zod";

export const applianceSchema = z.enum([
  "stove",
  "oven",
  "microwave",
  "blender",
  "multicooker",
  "airfryer",
  "grill",
]);

export const generateInputSchema = z.object({
  ingredients: z
    .array(z.string().trim().min(1).max(120))
    .min(1, "Укажите хотя бы один продукт")
    .max(40, "Слишком много продуктов — сократите список"),
  appliances: z
    .array(applianceSchema)
    .min(1, "Выберите хотя бы одну кухонную технику"),
  mode: z.enum(["from_pantry", "with_shopping"]),
  maxTimeMinutes: z.number().int().min(5).max(480).optional(),
  dietPreferences: z.string().trim().max(300).optional(),
  targetCalories: z.number().int().min(100).max(2500).optional(),
});

export const ingredientLineSchema = z.object({
  name: z.string(),
  amount: z.string(),
  kind: z.enum(["user", "basic", "optional", "shopping"]),
});

export const recipeSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  ingredients: z.array(ingredientLineSchema).min(1),
  steps: z.array(z.string()).min(1),
  timeMinutes: z.number().int().positive(),
  caloriesPerServingApproximate: z.number().positive(),
  servings: z.number().int().positive().default(2),
  shoppingList: z.array(z.string()).optional(),
});

export const geminiResponseSchema = z.object({
  warnings: z.array(z.string()).default([]),
  recipes: z.array(recipeSchema).min(1).max(3),
});
