import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {delay, Observable, timer} from 'rxjs';
import {map, mapTo, tap} from 'rxjs/operators';
import {Crag} from '../../models/crag';
import {HttpClient} from '@angular/common/http';
import {CacheService} from '../../cache/cache.service';

/**
 * CRUD service for crags.
 */
@Injectable({
  providedIn: 'root'
})
export class CragsService {

  constructor(private api: ApiService,
              private cache: CacheService,
              private http: HttpClient) {
  }

  /**
   * Creates a Crag.
   *
   * @param crag Crag to persist.
   * @param regionId ID of the region to create the crag in.
   * @return Observable of a Crag.
   */
  public createCrag(crag: Crag, regionId: string): Observable<Crag> {
    return this.http.post(this.api.crags.create(regionId), Crag.serialize(crag)).pipe(
      tap(() => {
        this.cache.clear(this.api.crags.getList());
      }),
      map(Crag.deserialize)
    );
  }

  /**
   * Returns a list of Crags.
   *
   * @return Observable of a list of Crags.
   */
  public getCrags(): Observable<Crag[]> {
    return this.cache.get(this.api.crags.getList(), map((cragListJson: any) => cragListJson.map(Crag.deserialize)));
  }

  /**
   * Returns a Crag.
   *
   * @param slug: Slug of the Crag to load.
   * @return Observable of a Crag.
   */
  public getCrag(slug: string): Observable<Crag> {
    return this.cache.get(this.api.crags.getDetail(slug), map(Crag.deserialize));
  }

  /**
   * Deletes a Crag.
   *
   * @param crag Crag to delete.
   * @return Observable of a Crag.
   */
  public deleteCrag(crag: Crag): Observable<null> {
    return this.http.delete(this.api.crags.delete(crag.id)).pipe(
      tap(() => {
        this.cache.clear(this.api.crags.getList());
      }),
      map(() => null)
    );
  }

  /**
   * Updates a Crag.
   *
   * @param crag Crag to persist.
   * @return Observable of null.
   */
  public updateCrag(crag: Crag): Observable<Crag> {
    return this.http.put(this.api.crags.update(crag.id), Crag.serialize(crag)).pipe(
      tap(() => {
        this.cache.clear(this.api.crags.getDetail(crag.slug));
        this.cache.clear(this.api.crags.getList());
      }),
      map(Crag.deserialize)
    );
  }

}
