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
  RockExplorerPathSource,
} from './rock-explorer-misc';

export type RockExplorerFeatureStatus = 'draft' | 'published';

/**
 * Rock Explorer mapped feature (Point or Polygon).
 * Drafts may omit geometry until publish.
 * Pause/resume GPS capture is client session state — not on this model.
 */
export class RockExplorerFeature extends AbstractModel {
  title: string | null;
  description: string | null;
  status: RockExplorerFeatureStatus;
  recordingDeviceId: string | null;
  recordingUpdatedAt: string | null;
  potential: RockExplorerPotential | null;
  rockQuality: RockExplorerRockQuality | null;
  rockType: RockExplorerRockType | null;
  gradeLineType: LineType | null;
  gradeScale: string | null;
  gradeValueMin: number | null;
  gradeValueMax: number | null;
  accessIssues: RockExplorerAccessIssue[] = [];
  geometry: Geometry | null;
  parkingSites: RockExplorerParkingSite[] = [];
  paths: RockExplorerPath[] = [];
  /** Topo targets stored as Tag associations (same shape as gallery tags). */
  topoLinks: Tag[] = [];
  createdBy: User | null;

  public static deserialize(payload: any): RockExplorerFeature {
    const feature = new RockExplorerFeature();
    AbstractModel.deserializeAbstractAttributes(feature, payload);
    feature.title = payload.title ?? null;
    feature.description = payload.description ?? null;
    feature.status = payload.status ?? 'published';
    feature.recordingDeviceId = payload.recordingDeviceId ?? null;
    feature.recordingUpdatedAt = payload.recordingUpdatedAt ?? null;
    feature.potential = payload.potential ?? null;
    feature.rockQuality = payload.rockQuality ?? null;
    feature.rockType = payload.rockType ?? null;
    feature.gradeLineType = payload.gradeLineType ?? null;
    feature.gradeScale = payload.gradeScale ?? null;
    feature.gradeValueMin = payload.gradeValueMin ?? null;
    feature.gradeValueMax = payload.gradeValueMax ?? null;
    feature.accessIssues = payload.accessIssues ?? [];
    feature.geometry = payload.geometry ?? null;
    feature.parkingSites = payload.parkingSites ?? [];
    feature.paths = (payload.paths ?? []).map((path: any) => ({
      id: path.id,
      source: (path.source as RockExplorerPathSource) ?? 'manual',
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
    const status = feature.status ?? 'published';
    const body: any = {
      title: feature.title,
      description: feature.description,
      status,
      potential: feature.potential,
      rockQuality: feature.rockQuality,
      rockType: feature.rockType,
      gradeLineType: feature.gradeLineType,
      gradeScale: feature.gradeScale,
      gradeValueMin: feature.gradeValueMin,
      gradeValueMax: feature.gradeValueMax,
      accessIssues: feature.accessIssues ?? [],
      geometry: feature.geometry,
      parkingSites: (feature.parkingSites ?? []).filter(
        (site) => site.lat != null && site.lng != null,
      ),
      paths: (feature.paths ?? []).filter(
        (path) => (path.geometry?.coordinates?.length ?? 0) >= 2,
      ),
      topoLinks: (feature.topoLinks ?? []).map(Tag.serialize),
    };
    if (status === 'draft') {
      body.recordingDeviceId = feature.recordingDeviceId;
    } else {
      body.recordingDeviceId = null;
    }
    return body;
  }
}
