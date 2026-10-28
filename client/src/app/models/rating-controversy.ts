import { LineType } from '../enums/line-type';

/** A crag, sector, or area named on a controversy row. */
export interface RatingControversySpot {
  name: string;
  slug: string;
}

/**
 * A line whose author grade or rating disagrees with the consensus of logged ascents.
 */
export interface RatingControversy {
  id: string;
  name: string;
  slug: string;
  type: LineType;
  gradeScale: string;
  authorGradeValue: number;
  userGradeValue: number;
  authorRating: number | null;
  userRating: number | null;
  ascentCount: number;
  gradeDiffers: boolean;
  ratingDiffers: boolean;
  crag: RatingControversySpot;
  sector: RatingControversySpot;
  area: RatingControversySpot;
  routerLink: string;
}

export type ControversyKind = 'grade' | 'rating';

export interface RatingControversyPage {
  items: RatingControversy[];
  hasNext: boolean;
  kind: ControversyKind | null;
  compareGrades: boolean;
  compareRatings: boolean;
}
