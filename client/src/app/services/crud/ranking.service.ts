import { Injectable } from '@angular/core';
import {ApiService} from '../core/api.service';
import {CacheService} from '../core/cache.service';
import {Store} from '@ngrx/store';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Paginated} from '../../models/paginated';
import {Ascent} from '../../models/ascent';
import {map} from 'rxjs/operators';
import {Crag} from '../../models/crag';
import {Ranking} from '../../models/ranking';

@Injectable({
  providedIn: 'root'
})
export class RankingService {

  constructor(private api: ApiService,
              private cache: CacheService) {
  }

  public getRanking(filters: string): Observable<Ranking[]> {
    return this.cache.get(this.api.ranking.getList(filters), map((rankingListJson: any) => rankingListJson.map(Ranking.deserialize)));
  }

}
