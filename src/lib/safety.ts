const UNSAFE_PATTERNS: RegExp[] = [
  /протух/i,
  /испорчен/i,
  /просроч/i,
  /пахнет\s+(плохо|странно|гниль|кисло)/i,
  /гниль/i,
  /плесен/i,
  /плесень/i,
  /токсичн/i,
  /ядовит/i,
  /spoiled/i,
  /rotten/i,
  /moldy/i,
  /expired/i,
  /raw\s+meat.*(smell|bad)/i,
  /сомнительн/i,
  /не\s+свеж/i,
];

export function detectUnsafeIngredients(ingredients: string[]): {
  safe: string[];
  unsafe: string[];
  warnings: string[];
} {
  const safe: string[] = [];
  const unsafe: string[] = [];
  const warnings: string[] = [];

  for (const raw of ingredients) {
    const item = raw.trim();
    if (!item) continue;
    if (UNSAFE_PATTERNS.some((re) => re.test(item))) {
      unsafe.push(item);
      warnings.push(
        `Продукт «${item}» выглядит сомнительным по безопасности. Не используйте его в блюде — утилизируйте при признаках порчи.`
      );
    } else {
      safe.push(item);
    }
  }

  if (unsafe.length > 0 && safe.length === 0) {
    warnings.push(
      "Все указанные продукты вызывают сомнения в безопасности. Рецепт из них не предлагаем."
    );
  }

  return { safe, unsafe, warnings };
}
