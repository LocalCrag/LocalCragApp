import { User } from './user';

export interface TopoQualitySummary {
  earned: number;
  max: number;
  bonus: number;
  percent: number;
  tier: string;
}

export interface TopoQualityAreaNode extends TopoQualitySummary {
  name: string;
  slug: string;
  cragSlug: string;
  sectorSlug: string;
}

export interface TopoQualitySectorNode extends TopoQualitySummary {
  name: string;
  slug: string;
  cragSlug: string;
  areas: TopoQualityAreaNode[];
}

export interface TopoQualityCragNode extends TopoQualitySummary {
  name: string;
  slug: string;
  sectors: TopoQualitySectorNode[];
}

export interface TopoQualityTree {
  gymMode: boolean;
  region: TopoQualitySummary & {
    name: string;
    slug: null;
    crags: TopoQualityCragNode[];
  };
}

export interface TopoQualityItem {
  kind: 'line' | 'topoImage' | 'area' | 'sector' | 'crag';
  name: string;
  cragSlug: string;
  sectorSlug: string | null;
  areaSlug: string | null;
  lineSlug: string | null;
  cragName?: string | null;
  sectorName?: string | null;
  areaName?: string | null;
}

export interface TopoQualityCheck {
  key: string;
  earned: number;
  max: number;
  bonus: boolean;
  items: TopoQualityItem[];
  remaining: number;
}

export interface TopoQualityDetail extends TopoQualitySummary {
  level: 'region' | 'crag' | 'sector' | 'area';
  name: string;
  gymMode: boolean;
  cragSlug: string | null;
  sectorSlug: string | null;
  areaSlug: string | null;
  checks: TopoQualityCheck[];
}

export interface TopoQualityRankingRow {
  rank: number;
  points: number;
  user: User;
}

export function itemCrumbs(item: TopoQualityItem): string[] {
  const crumbs: string[] = [];
  if (item.kind !== 'crag' && item.cragSlug !== '_default' && item.cragName) {
    crumbs.push(item.cragName);
  }
  if (
    item.kind !== 'crag' &&
    item.kind !== 'sector' &&
    item.sectorSlug !== '_default' &&
    item.sectorName
  ) {
    crumbs.push(item.sectorName);
  }
  if ((item.kind === 'line' || item.kind === 'topoImage') && item.areaName) {
    crumbs.push(item.areaName);
  }
  return crumbs;
}

export function itemLink(item: TopoQualityItem): string[] {
  if (item.kind === 'line') {
    return [
      '/topo',
      item.cragSlug,
      item.sectorSlug,
      item.areaSlug,
      item.lineSlug,
    ];
  }
  if (item.kind === 'area' || item.kind === 'topoImage') {
    const link = ['/topo', item.cragSlug, item.sectorSlug, item.areaSlug];
    if (item.kind === 'topoImage') {
      link.push('topo-images');
    }
    return link;
  }
  if (item.kind === 'sector') {
    return ['/topo', item.cragSlug, item.sectorSlug];
  }
  return ['/topo', item.cragSlug];
}

export function rankingRows(payload: any[]): TopoQualityRankingRow[] {
  return (payload ?? []).map((row) => ({
    rank: row.rank,
    points: row.points,
    user: User.deserialize(row.user),
  }));
}
