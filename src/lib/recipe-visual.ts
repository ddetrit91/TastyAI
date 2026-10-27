import type { Recipe } from "@/lib/types";

export type DishMood =
  | "pasta"
  | "soup"
  | "salad"
  | "bowl"
  | "grill"
  | "bake"
  | "breakfast"
  | "comfort"
  | "default";

/** Curated Unsplash photos — atmospheric food placeholders (not AI-generated). */
const MOOD_IMAGES: Record<DishMood, { src: string; label: string }> = {
  pasta: {
    src: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80",
    label: "Паста",
  },
  soup: {
    src: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80",
    label: "Суп",
  },
  salad: {
    src: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
    label: "Салат",
  },
  bowl: {
    src: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
    label: "Боул",
  },
  grill: {
    src: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80",
    label: "Гриль",
  },
  bake: {
    src: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
    label: "Выпечка",
  },
  breakfast: {
    src: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80",
    label: "Завтрак",
  },
  comfort: {
    src: "https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=900&q=80",
    label: "Уютное",
  },
  default: {
    src: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80",
    label: "Ужин",
  },
};

const RULES: { mood: DishMood; re: RegExp }[] = [
  { mood: "pasta", re: /паст|спагет|пенне|лапш|noodle|pasta|macaroni|фузилл/i },
  { mood: "soup", re: /суп|бульон|похлёб|chowder|soup|борщ|щи|крем-суп/i },
  { mood: "salad", re: /салат|salad|винегрет|зелен/i },
  { mood: "bowl", re: /боул|миск|bowl|поке|poke|рис с|киноа/i },
  { mood: "grill", re: /гриль|жарен|стейк|шашлык|grill|roast|обжар/i },
  { mood: "bake", re: /запеч|духов|пирог|выпеч|bake|casserole|гратен/i },
  { mood: "breakfast", re: /яичн|омлет|скрэмбл|завтрак|блин|toast|egg|сырник/i },
  { mood: "comfort", re: /тушён|рагу|пюре|картоф|comfort|сытн|ужин/i },
];

export function getDishMood(recipe: Pick<Recipe, "title" | "description">): DishMood {
  const hay = `${recipe.title} ${recipe.description}`;
  for (const rule of RULES) {
    if (rule.re.test(hay)) return rule.mood;
  }
  return "default";
}

export function getRecipeVisual(recipe: Pick<Recipe, "id" | "title" | "description">) {
  const mood = getDishMood(recipe);
  const base = MOOD_IMAGES[mood];
  // Slight variety per recipe id via Unsplash img ixid-less crop offset in query
  const seed = [...recipe.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const src = `${base.src}&sat=${seed % 3 === 0 ? "-10" : "0"}`;
  return { mood, ...base, src };
}

export function teaserText(description: string, max = 96): string {
  const clean = description.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}
