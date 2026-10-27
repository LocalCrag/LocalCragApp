export const TOPO_QUALITY_TIER_COLOR: Record<string, string> = {
  weak: '#e11d48',
  okay: '#ea580c',
  solid: '#ca8a04',
  good: '#16a34a',
  platin: '#0284c7',
};

export function topoQualityTierColor(tier: string): string {
  return TOPO_QUALITY_TIER_COLOR[tier] ?? TOPO_QUALITY_TIER_COLOR.solid;
}
