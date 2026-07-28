import { AbstractModel } from './abstract-model';
import { User } from './user';
import { RockExplorerPotential } from '../enums/rock-explorer-potential';
import { RockExplorerRockQuality } from '../enums/rock-explorer-rock-quality';
import { RockExplorerRockType } from '../enums/rock-explorer-rock-type';
import { RockExplorerAccessIssue } from '../enums/rock-explorer-access-issue';
import { LineType } from '../enums/line-type';
import { Geometry, LineString } from 'geojson';
import { Tag } from './tag';
import {
  RockExplorerParkingSite,
  RockExplorerPath,
  cloneParkingSites,
  clonePaths,
} from './rock-explorer-misc';

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
  parkingSites: RockExplorerParkingSite[];
  paths: RockExplorerPath[];
  /** Topo targets stored as Tag associations (same shape as gallery tags). */
  topoLinks: Tag[];
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
    feature.parkingSites = cloneParkingSites(payload.parkingSites);
    feature.paths = (payload.paths ?? []).map((path: any) => ({
      id: path.id,
      title: path.title ?? null,
      description: path.description ?? null,
      geometry: path.geometry as LineString,
    }));
    feature.topoLinks = (payload.topoLinks ?? []).map(Tag.deserialize);
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
      parkingSites: cloneParkingSites(feature.parkingSites)
        .filter((site) => site.lat != null && site.lng != null)
        .map((site) => ({
          ...site,
          lat: site.lat as number,
          lng: site.lng as number,
        })),
      paths: clonePaths(feature.paths).filter(
        (path) => (path.geometry?.coordinates?.length ?? 0) >= 2,
      ),
      topoLinks: (feature.topoLinks ?? []).map(Tag.serialize),
    };
  }
}
