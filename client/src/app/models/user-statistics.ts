import { LineType } from '../enums/line-type';

/** Hardest logged grade for a line type + scale (ascent grade_value). */
export type HardestGradeBucket = {
  lineType: LineType;
  gradeScale: string;
  gradeValue: number;
};

export type UserAscentTotals = {
  total: number;
  flashCount: number;
  flashPercent: number;
  faCount: number;
  upgradeCount: number;
  downgradeCount: number;
  biggestUpgradeGrades: number;
  biggestDowngradeGrades: number;
  hardestAscentGrades: HardestGradeBucket[];
  hardestFlashGrades: HardestGradeBucket[];
  hardestFaGrades: HardestGradeBucket[];
  softPercent: number;
  hardPercent: number;
};

export type UserModerationStats = {
  cragsCreated: number;
  sectorsCreated: number;
  areasCreated: number;
  linesCreated: number;
  postsWritten: number;
};

export type UserStatistics = {
  ascentsPerYear: Record<string, number>;
  ascentTotals: UserAscentTotals;
  globalRankByLineType: Partial<Record<LineType, number | null>>;
  /** Global rank when leaderboard is sorted by top-50 score (then top 10, then total). */
  globalRankTop50ByLineType: Partial<Record<LineType, number | null>>;
  /** Global rank when leaderboard is sorted by total ascent count (then top 10, top 50). */
  globalRankTotalCountByLineType: Partial<Record<LineType, number | null>>;
  social: {
    commentsCount: number;
    reactionsCount: number;
    galleryImagesUploaded: number;
  };
  moderation: UserModerationStats;
};

export class UserStatisticsModel {
  public static deserialize(payload: any): UserStatistics {
    return {
      ascentsPerYear: payload.ascentsPerYear ?? {},
      ascentTotals: {
        total: payload.ascentTotals?.total ?? 0,
        flashCount: payload.ascentTotals?.flashCount ?? 0,
        flashPercent: payload.ascentTotals?.flashPercent ?? 0,
        faCount: payload.ascentTotals?.faCount ?? 0,
        upgradeCount: payload.ascentTotals?.upgradeCount ?? 0,
        downgradeCount: payload.ascentTotals?.downgradeCount ?? 0,
        biggestUpgradeGrades: payload.ascentTotals?.biggestUpgradeGrades ?? 0,
        biggestDowngradeGrades:
          payload.ascentTotals?.biggestDowngradeGrades ?? 0,
        hardestAscentGrades: (payload.ascentTotals?.hardestAscentGrades ??
          []) as HardestGradeBucket[],
        hardestFlashGrades: (payload.ascentTotals?.hardestFlashGrades ??
          []) as HardestGradeBucket[],
        hardestFaGrades: (payload.ascentTotals?.hardestFaGrades ??
          []) as HardestGradeBucket[],
        softPercent: payload.ascentTotals?.softPercent ?? 0,
        hardPercent: payload.ascentTotals?.hardPercent ?? 0,
      },
      globalRankByLineType: payload.globalRankByLineType ?? {},
      globalRankTop50ByLineType: payload.globalRankTop50ByLineType ?? {},
      globalRankTotalCountByLineType:
        payload.globalRankTotalCountByLineType ?? {},
      social: {
        commentsCount: payload.social?.commentsCount ?? 0,
        reactionsCount: payload.social?.reactionsCount ?? 0,
        galleryImagesUploaded: payload.social?.galleryImagesUploaded ?? 0,
      },
      moderation: {
        cragsCreated: payload.moderation?.cragsCreated ?? 0,
        sectorsCreated: payload.moderation?.sectorsCreated ?? 0,
        areasCreated: payload.moderation?.areasCreated ?? 0,
        linesCreated: payload.moderation?.linesCreated ?? 0,
        postsWritten: payload.moderation?.postsWritten ?? 0,
      },
    };
  }
}
