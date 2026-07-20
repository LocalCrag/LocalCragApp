import { User } from './user';

export class Ranking {
  top10: number;
  top50: number;
  totalCount: number;
  rankTop10: number | null;
  rankTop50: number | null;
  rankTotalCount: number | null;
  user: User;

  // Helpers for easier template usage
  routerLinkUser: string;

  public static deserialize(payload: any): Ranking {
    const ranking = new Ranking();
    ranking.top10 = payload.top10;
    ranking.top50 = payload.top50;
    ranking.totalCount = payload.totalCount;
    ranking.rankTop10 = payload.rankTop10 ?? null;
    ranking.rankTop50 = payload.rankTop50 ?? null;
    ranking.rankTotalCount = payload.rankTotalCount ?? null;
    ranking.user = User.deserialize(payload.user);

    ranking.routerLinkUser = `/users/${ranking.user.slug}`;

    return ranking;
  }
}
