export type CookingMode = "from_pantry" | "with_shopping";

export type ApplianceId =
  | "stove"
  | "oven"
  | "microwave"
  | "blender"
  | "multicooker"
  | "airfryer"
  | "grill";

export interface IngredientLine {
  name: string;
  amount: string;
  kind: "user" | "basic" | "optional" | "shopping";
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: IngredientLine[];
  steps: string[];
  timeMinutes: number;
  caloriesPerServingApproximate: number;
  servings: number;
  shoppingList?: string[];
}

export interface GenerateInput {
  ingredients: string[];
  appliances: ApplianceId[];
  mode: CookingMode;
  maxTimeMinutes?: number;
  dietPreferences?: string;
  targetCalories?: number;
}

export interface GenerateResult {
  recipes: Recipe[];
  warnings: string[];
  demo: boolean;
  generationId?: string;
}

export interface HistoryItem {
  id: string;
  createdAt: string;
  input: GenerateInput;
  recipes: Recipe[];
  warnings: string[];
  demo: boolean;
}

export interface FavoriteItem {
  id: string;
  title: string;
  recipe: Recipe;
  createdAt: string;
  sourceGenerationId?: string | null;
}

export const APPLIANCES: { id: ApplianceId; label: string }[] = [
  { id: "stove", label: "Плита" },
  { id: "oven", label: "Духовка" },
  { id: "microwave", label: "Микроволновка" },
  { id: "blender", label: "Блендер" },
  { id: "multicooker", label: "Мультиварка" },
  { id: "airfryer", label: "Аэрогриль" },
  { id: "grill", label: "Гриль" },
];
