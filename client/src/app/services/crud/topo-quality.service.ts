import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  TopoPointsHistory,
  TopoQualityDetail,
  TopoQualityHistory,
  TopoQualityRankingRow,
  TopoQualityTree,
  rankingRows,
} from '../../models/topo-quality';
import { User } from '../../models/user';
import { ApiService } from '../core/api.service';

@Injectable({
  providedIn: 'root',
})
export class TopoQualityService {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  tree(excludeSecret: boolean): Observable<TopoQualityTree> {
    return this.http.get<TopoQualityTree>(this.api.topoQuality.tree(), {
      params: this.params(excludeSecret),
    });
  }

  detail(
    level: string,
    slugs: { cragSlug?: string; sectorSlug?: string; areaSlug?: string },
    excludeSecret: boolean,
  ): Observable<TopoQualityDetail> {
    return this.http.get<TopoQualityDetail>(
      this.api.topoQuality.detail(level, slugs),
      { params: this.params(excludeSecret) },
    );
  }

  ranking(): Observable<TopoQualityRankingRow[]> {
    return this.http
      .get<any[]>(this.api.topoQuality.ranking())
      .pipe(map((rows) => rankingRows(rows)));
  }

  history(): Observable<TopoQualityHistory> {
    return this.http.get<TopoQualityHistory>(this.api.topoQuality.history());
  }

  pointsHistory(): Observable<TopoPointsHistory> {
    return this.http.get<any>(this.api.topoQuality.pointsHistory()).pipe(
      map((payload) => ({
        weeks: payload?.weeks ?? [],
        series: (payload?.series ?? []).map((row) => ({
          points: row.points ?? [],
          user: User.deserialize(row.user),
        })),
      })),
    );
  }

  restart(confirmation: string): Observable<{ restarted: boolean }> {
    return this.http.post<{ restarted: boolean }>(
      this.api.topoQuality.restart(),
      { confirmation },
    );
  }

  private params(excludeSecret: boolean) {
    return excludeSecret ? { excludeSecret: 'true' } : {};
  }
}
