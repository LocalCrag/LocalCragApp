import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { ClosureState } from '../../models/closure-state';

export type ClosedSpotType = 'crag' | 'sector' | 'area' | 'line';

/**
 * Loads materialized closure state for topo entities.
 */
@Injectable({
  providedIn: 'root',
})
export class ClosureStateService {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private cache = new Map<string, Observable<ClosureState>>();

  public getClosureState(
    spotType: ClosedSpotType,
    slug: string,
  ): Observable<ClosureState> {
    const key = `${spotType}:${slug}`;
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        this.fetchClosureState(spotType, slug).pipe(shareReplay(1)),
      );
    }
    return this.cache.get(key)!;
  }

  public getCragClosureState(cragSlug: string): Observable<ClosureState> {
    return this.getClosureState('crag', cragSlug);
  }

  public getSectorClosureState(sectorSlug: string): Observable<ClosureState> {
    return this.getClosureState('sector', sectorSlug);
  }

  public getAreaClosureState(areaSlug: string): Observable<ClosureState> {
    return this.getClosureState('area', areaSlug);
  }

  public getLineClosureState(lineSlug: string): Observable<ClosureState> {
    return this.getClosureState('line', lineSlug);
  }

  private fetchClosureState(
    spotType: ClosedSpotType,
    slug: string,
  ): Observable<ClosureState> {
    const url = {
      crag: this.api.crags.getClosureState(slug),
      sector: this.api.sectors.getClosureState(slug),
      area: this.api.areas.getClosureState(slug),
      line: this.api.lines.getClosureState(slug),
    }[spotType];

    return this.http.get(url).pipe(map(ClosureState.deserialize));
  }
}
