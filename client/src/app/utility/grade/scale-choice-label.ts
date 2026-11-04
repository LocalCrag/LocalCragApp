/**
 * Filter and ranking labels append the line type in parentheses.
 */
export function scaleChoiceLabel(
  lineTypeLabel: string,
  gradeScale: string,
): string {
  return `${gradeScale} (${lineTypeLabel})`;
}
