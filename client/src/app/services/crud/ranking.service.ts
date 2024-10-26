import { Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Ranking } from '../../models/ranking';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class RankingService {
  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

  public getRanking(query_params: string): Observable<Ranking[]> {
    return this.http
      .get(this.api.ranking.getList(query_params))
      .pipe(
        map((rankingListJson: any) => rankingListJson.map(Ranking.deserialize)),
      );
  }
}
