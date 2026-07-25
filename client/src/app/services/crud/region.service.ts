import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Region } from '../../models/region';
import { Observable } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { deserializeGradeList, GradeDistribution } from '../../models/scale';
import { httpGetOptions } from '../../utility/http/query-params';

/**
 * CRUD service for regions.
 */
@Injectable({
  providedIn: 'root',
})
export class RegionService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  private regionCache$: Observable<Region> | null = null;

  /**
   * Returns a Region.
   *
   * @return Observable of a Region.
   */
  public getRegion(): Observable<Region> {
    return this.http
      .get(this.api.region.getDetail())
      .pipe(map(Region.deserialize));
  }

  /**
   * Returns the singleton Region, fetching it over HTTP only once per
   * session (`shareReplay(1)`). Intended for call sites (e.g. topo page
   * ancestor chains for the rules alert) that need the region on every
   * navigation without re-requesting it each time. The cache is invalidated
   * on `updateRegion(...)` so moderator edits are reflected immediately.
   *
   * @return Observable of the cached Region.
   */
  public getRegionCached(): Observable<Region> {
    if (!this.regionCache$) {
      this.regionCache$ = this.getRegion().pipe(shareReplay(1));
    }
    return this.regionCache$;
  }

  /**
   * Updates a Region.
   *
   * @param region Region to persist.
   * @return Observable of null.
   */
  public updateRegion(region: Region): Observable<Region> {
    return this.http
      .put(this.api.region.update(), Region.serialize(region))
      .pipe(
        map(Region.deserialize),
        tap(() => {
          this.regionCache$ = null;
        }),
      );
  }

  /**
   * Returns a list of Grades.
   *
   * @return Observable of a list of Grades.
   */
  public getRegionGrades(excludeClosed = false): Observable<GradeDistribution> {
    return this.http
      .get(
        this.api.region.getGrades(),
        httpGetOptions(excludeClosed ? { exclude_closed: '1' } : undefined),
      )
      .pipe(map(deserializeGradeList));
  }
}
