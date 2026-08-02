/**
 * Build a MapLibre `match` expression for a feature property.
 * Uses `fallbackKey` (default `"NONE"`) or the first color as the default branch.
 */
export function buildMatchExpression(
  property: string,
  colors: Record<string, string>,
  fallbackKey = 'NONE',
): unknown[] {
  const expression: unknown[] = ['match', ['get', property]];
  for (const [key, color] of Object.entries(colors)) {
    expression.push(key, color);
  }
  expression.push(colors[fallbackKey] ?? Object.values(colors)[0]);
  return expression;
}
