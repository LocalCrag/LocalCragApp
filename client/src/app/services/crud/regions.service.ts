import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {CacheService} from '../core/cache.service';
import {Store} from '@ngrx/store';
import {HttpClient} from '@angular/common/http';
import {Region} from '../../models/region';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {deserializeGrade, Grade} from '../../utility/misc/grades';

/**
 * CRUD service for regions.
 */
@Injectable({
  providedIn: 'root'
})
export class RegionsService {

  constructor(private api: ApiService,
              private cache: CacheService,
              private http: HttpClient) {
  }

  /**
   * Returns a Region.
   *
   * @param slug Slug of the Region to load.
   * @return Observable of a Region.
   */
  public getRegion(slug: string): Observable<Region> {
    return this.cache.get(this.api.regions.getDetail(slug), map(Region.deserialize));
  }

  /**
   * Updates a Region.
   *
   * @param region Region to persist.
   * @return Observable of null.
   */
  public updateRegion(region: Region): Observable<Region> {
    return this.http.put(this.api.regions.update(region.slug), Region.serialize(region)).pipe(
      tap(() => {
        this.cache.clear(this.api.regions.getDetail(region.slug));
      }),
      map(Region.deserialize)
    );
  }

  /**
   * Returns a list of Grades.
   *
   * @param regionSlug Slug of the region to return the grades for.
   * @return Observable of a list of Grades.
   */
  public getRegionGrades(regionSlug: string): Observable<Grade[]> {
    return this.cache.get(this.api.regions.getGrades(regionSlug), map((gradeListJson: any) => gradeListJson.map(deserializeGrade)));
  }

}
