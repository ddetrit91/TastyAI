import { GoogleGenerativeAI } from "@google/generative-ai";
import { randomUUID } from "crypto";
import { buildDemoResult } from "@/lib/demo-recipes";
import { buildRecipePrompt } from "@/lib/prompts";
import { detectUnsafeIngredients } from "@/lib/safety";
import { geminiResponseSchema } from "@/lib/schemas";
import type { GenerateInput, GenerateResult, Recipe } from "@/lib/types";

const DEFAULT_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-2.5-flash",
];

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const payload = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(payload);
}

function normalizeRecipes(
  recipes: Array<Omit<Recipe, "id"> & { id?: string }>
): Recipe[] {
  return recipes.map((r) => ({
    ...r,
    id: r.id || randomUUID(),
    servings: r.servings || 2,
  }));
}

function modelCandidates(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const list = preferred
    ? [preferred, ...DEFAULT_MODELS.filter((m) => m !== preferred)]
    : DEFAULT_MODELS;
  return Array.from(new Set(list));
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export async function generateRecipes(
  input: GenerateInput
): Promise<GenerateResult> {
  const { safe, warnings: preWarnings } = detectUnsafeIngredients(
    input.ingredients
  );

  if (safe.length === 0) {
    return { recipes: [], warnings: preWarnings, demo: !isGeminiConfigured() };
  }

  if (!isGeminiConfigured()) {
    return buildDemoResult({ ...input, ingredients: safe });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const prompt = buildRecipePrompt(
    { ...input, ingredients: safe },
    safe,
    preWarnings
  );

  const errors: string[] = [];

  for (const modelName of modelCandidates()) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = geminiResponseSchema.parse(extractJson(text));
      const warnings = Array.from(
        new Set([...preWarnings, ...parsed.warnings])
      );

      return {
        recipes: normalizeRecipes(parsed.recipes),
        warnings,
        demo: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Gemini model ${modelName} failed:`, message);
      errors.push(`${modelName}: ${message.slice(0, 160)}`);
    }
  }

  console.error("All Gemini models failed, falling back to demo:", errors);
  const demo = buildDemoResult({ ...input, ingredients: safe });
  return {
    ...demo,
    warnings: [
      ...preWarnings,
      "Не удалось получить ответ от Gemini — показан демо-режим. Проверьте API-ключ, модель и квоту.",
      ...demo.warnings.filter((w) => !preWarnings.includes(w)),
    ],
  };
}
