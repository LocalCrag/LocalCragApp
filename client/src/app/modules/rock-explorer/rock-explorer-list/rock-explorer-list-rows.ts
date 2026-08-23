import { Feature, FeatureCollection, Geometry } from 'geojson';
import { geometryAreaSqM } from '../../../utility/geo/polygon-area';

export type RockExplorerListRow = {
  id: string;
  title: string | null;
  potential: string | null;
  rockQuality: string | null;
  rockType: string | null;
  areaSqM: number | null;
};

export function rockExplorerFeaturesToListRows(
  collection: FeatureCollection<Geometry>,
): RockExplorerListRow[] {
  return (collection.features ?? []).flatMap((feature) => {
    const row = featureToListRow(feature);
    return row ? [row] : [];
  });
}

function featureToListRow(
  feature: Feature<Geometry>,
): RockExplorerListRow | null {
  const id = String(feature.id ?? feature.properties?.['id'] ?? '').trim();
  if (!id) {
    return null;
  }
  const props = feature.properties ?? {};
  return {
    id,
    title: (props['title'] as string | null | undefined) ?? null,
    potential: (props['potential'] as string | null | undefined) ?? null,
    rockQuality: (props['rockQuality'] as string | null | undefined) ?? null,
    rockType: (props['rockType'] as string | null | undefined) ?? null,
    areaSqM: geometryAreaSqM(feature.geometry),
  };
}

export function formatRockExplorerAreaSqM(
  areaSqM: number | null,
): string | null {
  if (areaSqM == null) {
    return null;
  }
  if (areaSqM >= 10_000) {
    const hectares = areaSqM / 10_000;
    return `${hectares.toLocaleString(undefined, { maximumFractionDigits: 1 })} ha`;
  }
  return `${Math.round(areaSqM).toLocaleString()} m²`;
}

export function compareRockExplorerListRows(
  a: RockExplorerListRow,
  b: RockExplorerListRow,
  field: keyof RockExplorerListRow,
  order: 1 | -1,
): number {
  const av = a[field];
  const bv = b[field];
  if (field === 'areaSqM') {
    const an = av == null ? -1 : (av as number);
    const bn = bv == null ? -1 : (bv as number);
    return (an - bn) * order;
  }
  const as = (av ?? '').toString().toLocaleLowerCase();
  const bs = (bv ?? '').toString().toLocaleLowerCase();
  if (as === bs) {
    return 0;
  }
  return (as < bs ? -1 : 1) * order;
}
