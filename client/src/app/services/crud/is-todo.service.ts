import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Store } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import { mergeMap, Observable, of } from 'rxjs';
import { selectCurrentUser } from '../../ngrx/selectors/auth.selectors';
import { map, take } from 'rxjs/operators';
import {
  ApiQueryParams,
  httpGetOptions,
} from '../../utility/http/query-params';

@Injectable({
  providedIn: 'root',
})
export class IsTodoService {
  private api = inject(ApiService);
  private store = inject(Store);
  private http = inject(HttpClient);

  public getIsTodo(
    crag_id?: string,
    sector_id?: string,
    area_id?: string,
    line_ids?: string[],
  ): Observable<Set<string>> {
    return this.store
      .select(selectCurrentUser)
      .pipe(take(1))
      .pipe(
        mergeMap((user) => {
          if (!user) {
            return of(new Set<string>());
          }
          const params: ApiQueryParams = { user_id: user.id };
          if (crag_id) {
            params.crag_id = crag_id;
          }
          if (sector_id) {
            params.sector_id = sector_id;
          }
          if (area_id) {
            params.area_id = area_id;
          }
          if (line_ids) {
            params.line_ids = line_ids.join(',');
          }
          return this.http
            .get(this.api.isTodo.getList(), httpGetOptions(params))
            .pipe(
              map((ticks) => {
                const resultSet = new Set<string>();
                (ticks as string[]).map((tick) => {
                  resultSet.add(tick);
                });
                return resultSet;
              }),
            );
        }),
      );
  }
}
