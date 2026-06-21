import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Ranking } from '../../models/ranking';
import { HttpClient } from '@angular/common/http';
import {
  ApiQueryParams,
  httpGetOptions,
} from '../../utility/http/query-params';

@Injectable({
  providedIn: 'root',
})
export class RankingService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  public getRanking(params: ApiQueryParams): Observable<Ranking[]> {
    return this.http
      .get(this.api.ranking.getList(), httpGetOptions(params))
      .pipe(
        map((rankingListJson: any) => rankingListJson.map(Ranking.deserialize)),
      );
  }
}
