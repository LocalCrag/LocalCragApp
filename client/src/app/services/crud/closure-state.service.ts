import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { ClosureState } from '../../models/closure-state';

/**
 * Loads materialized closure state for topo entities (form parent alerts).
 */
@Injectable({
  providedIn: 'root',
})
export class ClosureStateService {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  public getCragClosureState(cragSlug: string): Observable<ClosureState> {
    return this.http
      .get(this.api.crags.getClosureState(cragSlug))
      .pipe(map(ClosureState.deserialize));
  }

  public getSectorClosureState(sectorSlug: string): Observable<ClosureState> {
    return this.http
      .get(this.api.sectors.getClosureState(sectorSlug))
      .pipe(map(ClosureState.deserialize));
  }

  public getAreaClosureState(areaSlug: string): Observable<ClosureState> {
    return this.http
      .get(this.api.areas.getClosureState(areaSlug))
      .pipe(map(ClosureState.deserialize));
  }
}
