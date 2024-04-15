import { Injectable } from '@angular/core';
import {ApiService} from '../core/api.service';
import {CacheService} from '../core/cache.service';
import {Store} from '@ngrx/store';
import {HttpClient} from '@angular/common/http';
import {Area} from '../../models/area';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {reloadMenus} from '../../ngrx/actions/core.actions';
import {Ascent} from '../../models/ascent';
import {Crag} from '../../models/crag';
import {clearAscentCache, clearGradeCache} from '../../ngrx/actions/cache.actions';

@Injectable({
  providedIn: 'root'
})
export class AscentsService {

  constructor(private api: ApiService,
              private cache: CacheService,
              private store: Store,
              private http: HttpClient) {
  }

  public getAscents(filters: string): Observable<Ascent[]> {
    return this.cache.get(this.api.ascents.getList(filters), map((ascentListJson: any) => ascentListJson.map(Ascent.deserialize)));
  }

  public createAscent(ascent: Ascent): Observable<Ascent> {
    return this.http.post(this.api.ascents.create(), Ascent.serialize(ascent)).pipe(
      map(Ascent.deserialize),
      tap(ascent => {
        this.store.dispatch(clearAscentCache({
          area: ascent.line.area.slug,
          crag: ascent.line.area.sector.crag.slug,
          line: ascent.line.slug,
          user: ascent.createdBy.slug,
          sector: ascent.line.area.sector.slug
        }))
      })
    );
  }

  public updateAscent(ascent: Ascent): Observable<Ascent> {
    return this.http.put(this.api.ascents.update(ascent.id), Ascent.serialize(ascent)).pipe(
      map(Ascent.deserialize),
      tap(ascent => {
        this.store.dispatch(clearAscentCache({
          area: ascent.line.area.slug,
          crag: ascent.line.area.sector.crag.slug,
          line: ascent.line.slug,
          user: ascent.createdBy.slug,
          sector: ascent.line.area.sector.slug
        }))
      })
    );
  }

  public deleteAscent(ascent: Ascent): Observable<null> {
    return this.http.delete(this.api.ascents.delete(ascent.id)).pipe(
      map(() => null),
      tap(() => {
        this.store.dispatch(clearAscentCache({
          area: ascent.line.area.slug,
          crag: ascent.line.area.sector.crag.slug,
          line: ascent.line.slug,
          user: ascent.createdBy.slug,
          sector: ascent.line.area.sector.slug
        }))
      })
    );
  }

}
