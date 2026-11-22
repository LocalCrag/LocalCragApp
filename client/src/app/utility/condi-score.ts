export type CondiScoreBand =
  'terrible' | 'poor' | 'mixed' | 'good' | 'veryGood' | 'excellent' | 'perfect';

/** CondiScore bands published by CondiCaster. */
export function condiScoreBand(score: number): CondiScoreBand {
  if (score < 1) return 'terrible';
  if (score < 2) return 'poor';
  if (score < 3) return 'mixed';
  if (score < 3.8) return 'good';
  if (score < 4.3) return 'veryGood';
  if (score < 4.8) return 'excellent';
  return 'perfect';
}

export function formatCondiScore(score: number): string {
  return score.toFixed(1);
}

export const CONDI_BAND_COLOR: Record<CondiScoreBand, string> = {
  terrible: '#b91c1c',
  poor: '#c2410c',
  mixed: '#a16207',
  good: '#4d7c0f',
  veryGood: '#15803d',
  excellent: '#0f766e',
  perfect: '#1d4ed8',
};
