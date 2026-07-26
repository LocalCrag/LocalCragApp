import { AbstractModel } from './abstract-model';
import { User } from './user';
import { RockExplorerPotential } from '../enums/rock-explorer-potential';
import { RockExplorerRockQuality } from '../enums/rock-explorer-rock-quality';
import { RockExplorerRockType } from '../enums/rock-explorer-rock-type';
import { RockExplorerAccessIssue } from '../enums/rock-explorer-access-issue';
import { LineType } from '../enums/line-type';
import { Geometry } from 'geojson';
import { Searchable } from './searchable';

/**
 * Rock Explorer mapped feature (Point or Polygon).
 */
export class RockExplorerFeature extends AbstractModel {
  title: string | null;
  description: string | null;
  potential: RockExplorerPotential | null;
  rockQuality: RockExplorerRockQuality | null;
  rockType: RockExplorerRockType | null;
  gradeLineType: LineType | null;
  gradeScale: string | null;
  gradeValueMin: number | null;
  gradeValueMax: number | null;
  accessIssues: RockExplorerAccessIssue[];
  geometry: Geometry;
  clusterId: string | null;
  cragId: string | null;
  sectorId: string | null;
  areaId: string | null;
  lineId: string | null;
  topoLink: Searchable | null;
  createdBy: User | null;

  public static deserialize(payload: any): RockExplorerFeature {
    const feature = new RockExplorerFeature();
    AbstractModel.deserializeAbstractAttributes(feature, payload);
    feature.title = payload.title ?? null;
    feature.description = payload.description ?? null;
    feature.potential = payload.potential ?? null;
    feature.rockQuality = payload.rockQuality ?? null;
    feature.rockType = payload.rockType ?? null;
    feature.gradeLineType = payload.gradeLineType ?? null;
    feature.gradeScale = payload.gradeScale ?? null;
    feature.gradeValueMin = payload.gradeValueMin ?? null;
    feature.gradeValueMax = payload.gradeValueMax ?? null;
    feature.accessIssues = payload.accessIssues ?? [];
    feature.geometry = payload.geometry;
    feature.clusterId = payload.clusterId ?? null;
    feature.cragId = payload.cragId ?? null;
    feature.sectorId = payload.sectorId ?? null;
    feature.areaId = payload.areaId ?? null;
    feature.lineId = payload.lineId ?? null;
    feature.topoLink = payload.topoLink
      ? Searchable.deserialize(payload.topoLink)
      : null;
    feature.createdBy = payload.createdBy
      ? User.deserialize(payload.createdBy)
      : null;
    return feature;
  }

  public static serialize(feature: RockExplorerFeature): any {
    return {
      title: feature.title,
      description: feature.description,
      potential: feature.potential,
      rockQuality: feature.rockQuality,
      rockType: feature.rockType,
      gradeLineType: feature.gradeLineType,
      gradeScale: feature.gradeScale,
      gradeValueMin: feature.gradeValueMin,
      gradeValueMax: feature.gradeValueMax,
      accessIssues: feature.accessIssues ?? [],
      geometry: feature.geometry,
      clusterId: feature.clusterId,
      cragId: feature.cragId,
      sectorId: feature.sectorId,
      areaId: feature.areaId,
      lineId: feature.lineId,
    };
  }
}
