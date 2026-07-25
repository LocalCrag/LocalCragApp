import { AbstractModel } from './abstract-model';
import { User } from './user';
import { RockExplorerPotential } from '../enums/rock-explorer-potential';
import { RockExplorerRockQuality } from '../enums/rock-explorer-rock-quality';
import { RockExplorerRockType } from '../enums/rock-explorer-rock-type';
import { RockExplorerAccessIssue } from '../enums/rock-explorer-access-issue';
import { LineType } from '../enums/line-type';

/**
 * Rock Explorer cluster grouping a set of features. Has no geometry of its own;
 * the map derives a hull from its member features.
 */
export class RockExplorerCluster extends AbstractModel {
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
  cragId: string | null;
  sectorId: string | null;
  areaId: string | null;
  lineId: string | null;
  featureIds: string[];
  createdBy: User | null;

  public static deserialize(payload: any): RockExplorerCluster {
    const cluster = new RockExplorerCluster();
    AbstractModel.deserializeAbstractAttributes(cluster, payload);
    cluster.title = payload.title ?? null;
    cluster.description = payload.description ?? null;
    cluster.potential = payload.potential ?? null;
    cluster.rockQuality = payload.rockQuality ?? null;
    cluster.rockType = payload.rockType ?? null;
    cluster.gradeLineType = payload.gradeLineType ?? null;
    cluster.gradeScale = payload.gradeScale ?? null;
    cluster.gradeValueMin = payload.gradeValueMin ?? null;
    cluster.gradeValueMax = payload.gradeValueMax ?? null;
    cluster.accessIssues = payload.accessIssues ?? [];
    cluster.cragId = payload.cragId ?? null;
    cluster.sectorId = payload.sectorId ?? null;
    cluster.areaId = payload.areaId ?? null;
    cluster.lineId = payload.lineId ?? null;
    cluster.featureIds = payload.featureIds ?? [];
    cluster.createdBy = payload.createdBy
      ? User.deserialize(payload.createdBy)
      : null;
    return cluster;
  }

  public static serialize(cluster: RockExplorerCluster): any {
    return {
      title: cluster.title,
      description: cluster.description,
      potential: cluster.potential,
      rockQuality: cluster.rockQuality,
      rockType: cluster.rockType,
      gradeLineType: cluster.gradeLineType,
      gradeScale: cluster.gradeScale,
      gradeValueMin: cluster.gradeValueMin,
      gradeValueMax: cluster.gradeValueMax,
      accessIssues: cluster.accessIssues ?? [],
      cragId: cluster.cragId,
      sectorId: cluster.sectorId,
      areaId: cluster.areaId,
      lineId: cluster.lineId,
    };
  }
}
