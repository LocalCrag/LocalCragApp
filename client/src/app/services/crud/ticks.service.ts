import { Injectable } from '@angular/core';
import {ApiService} from '../core/api.service';
import {CacheService} from '../core/cache.service';
import {Store} from '@ngrx/store';
import {HttpClient} from '@angular/common/http';
import {mergeMap, Observable, of} from 'rxjs';
import {Ascent} from '../../models/ascent';
import {map, take} from 'rxjs/operators';
import {selectCurrentUser} from '../../ngrx/selectors/auth.selectors';

@Injectable({
  providedIn: 'root'
})
export class TicksService {

  constructor(private api: ApiService,
              private store: Store,
              private http: HttpClient) {
  }

  public getTicks(crag_id?: string, sector_id?: string, area_id?: string, line_id?: string): Observable<Set<string>> {
    return this.store.select(selectCurrentUser).pipe(take(1)).pipe(mergeMap(user => {
      if(!user){
        return of(new Set<string>())
      }
      let query_string_parts = [`user_id=${user.id}`];
      if (crag_id){
        query_string_parts.push(`crag_id=${crag_id}`)
      }
      if (sector_id){
        query_string_parts.push(`sector_id=${sector_id}`)
      }
      if (area_id){
        query_string_parts.push(`area_id=${area_id}`)
      }
      if (line_id){
        query_string_parts.push(`line_id=${line_id}`)
      }
      let query_string = `?${query_string_parts.join('&')}`
      return this.http.get(this.api.ticks.getList() + query_string).pipe(map((ticks) => {
        const resultSet = new Set<string>();
        (ticks as string[]).map(tick => {
          resultSet.add(tick);
        });
        return resultSet;
      }));
    }))
  }

}