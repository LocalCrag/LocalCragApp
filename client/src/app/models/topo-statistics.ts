import { LineType } from '../enums/line-type';

export interface TopoStatLine {
  name: string;
  slug: string;
  lineType: LineType;
  gradeScale: string;
  authorGradeValue: number;
  userGradeValue: number;
  areaSlug: string;
  sectorSlug: string;
  cragSlug: string;
  ascentCount: number;
  todoCount?: number;
}

export interface TopoStatistics {
  objectType: 'region' | 'crag' | 'sector' | 'area' | 'line';
  heatmap: Record<string, number>;
  ascentsPerYear: Record<string, number>;
  firstAscentsPerYear: Record<string, number> | null;
  firstAscentsUndated: number | null;
  social: {
    comments: number;
    galleryImages: number;
  };
  childKind: 'crag' | 'sector' | 'area' | null;
  children: { name: string; slug: string; lineCount: number }[] | null;
  coverage: {
    totalLines: number;
    projects: number;
    distinctClimbers: number | null;
    totalAscents: number;
  };
  flash: {
    count: number;
    percent: number;
  };
  consensus: {
    softCount: number;
    hardCount: number;
    softPercent: number;
    hardPercent: number;
  };
  ratings: {
    average: number | null;
    count: number;
    distribution: Record<string, number>;
  };
  disciplines: Record<string, number> | null;
  popularLines: TopoStatLine[] | null;
  gradeVotes: {
    gradeScale: string;
    lineType: LineType;
    authorGradeValue: number;
    userGradeValue: number;
    votes: Record<string, number>;
  } | null;
  wishlist: {
    todoCount: number;
    wantedLines: TopoStatLine[];
  };
  myCompletion: {
    ascended: number;
    total: number;
  } | null;
}
