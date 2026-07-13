import { Ascent } from './ascent';

export class InstanceStatisticsTotals {
  totalAscents: number;
  ascentsLastWeek: number;
  totalLines: number;
  totalUsers: number;

  public static deserialize(payload: any): InstanceStatisticsTotals {
    const totals = new InstanceStatisticsTotals();
    totals.totalAscents = payload.totalAscents;
    totals.ascentsLastWeek = payload.ascentsLastWeek;
    totals.totalLines = payload.totalLines;
    totals.totalUsers = payload.totalUsers;
    return totals;
  }
}

export class InstanceStatistics {
  totals: InstanceStatisticsTotals;
  hardestAscentsLastMonth: Ascent[];
  latestFirstAscents: Ascent[];

  public static deserialize(payload: any): InstanceStatistics {
    const stats = new InstanceStatistics();
    stats.totals = InstanceStatisticsTotals.deserialize(payload.totals);
    stats.hardestAscentsLastMonth = (payload.hardestAscentsLastMonth ?? []).map(
      Ascent.deserialize,
    );
    stats.latestFirstAscents = (payload.latestFirstAscents ?? []).map(
      Ascent.deserialize,
    );
    return stats;
  }
}
