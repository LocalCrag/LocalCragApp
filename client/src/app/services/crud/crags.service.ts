import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {delay, Observable, timer} from 'rxjs';
import {map, mapTo, tap} from 'rxjs/operators';
import {Crag} from '../../models/crag';
import {HttpClient} from '@angular/common/http';
import {CacheService} from '../../cache/cache.service';
import {environment} from '../../../environments/environment';
import {ItemOrder} from '../../interfaces/item-order.interface';
import {Store} from '@ngrx/store';
import {reloadCrags} from '../../ngrx/actions/core.actions';
import {deserializeGrade, Grade} from '../../utility/misc/grades';

/**
 * CRUD service for crags.
 */
@Injectable({
  providedIn: 'root'
})
export class CragsService {

  constructor(private api: ApiService,
              private cache: CacheService,
              private store: Store,
              private http: HttpClient) {
  }

  /**
   * Creates a Crag.
   *
   * @param crag Crag to persist.
   * @param regionSlug Slug of the region to create the crag in.
   * @return Observable of a Crag.
   */
  public createCrag(crag: Crag, regionSlug: string): Observable<Crag> {
    return this.http.post(this.api.crags.create(regionSlug), Crag.serialize(crag)).pipe(
      tap(() => {
        this.cache.clear(this.api.crags.getList(regionSlug));
        this.store.dispatch(reloadCrags());
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
    return this.cache.get(this.api.crags.getList(environment.regionSlug), map((cragListJson: any) => cragListJson.map(Crag.deserialize)));
  }

  /**
   * Returns a Crag.
   *
   * @param slug Slug of the Crag to load.
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
    return this.http.delete(this.api.crags.delete(crag.slug)).pipe(
      tap(() => {
        this.cache.clear(this.api.crags.getList(environment.regionSlug));
        this.store.dispatch(reloadCrags());
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
    return this.http.put(this.api.crags.update(crag.slug), Crag.serialize(crag)).pipe(
      tap(() => {
        this.cache.clear(this.api.crags.getDetail(crag.slug));
        this.cache.clear(this.api.crags.getList(environment.regionSlug));
        this.store.dispatch(reloadCrags());
      }),
      map(Crag.deserialize)
    );
  }

  /**
   * Updates the order of all crags.
   *
   * @param newOrder Crag order.
   * @return Observable of null.
   */
  public updateCragOrder(newOrder: ItemOrder): Observable<null> {
    return this.http.put(this.api.crags.updateOrder(), newOrder).pipe(
      tap(() => {
        this.cache.clear(this.api.crags.getList(environment.regionSlug));
      }),
      map(() => null)
    );
  }


  /**
   * Returns a list of Grades.
   *
   * @param cragSlug Slug of the crag to return the grades for.
   * @return Observable of a list of Grades.
   */
  public getCragGrades(cragSlug: string): Observable<Grade[]> {
    return this.cache.get(this.api.crags.getGrades(cragSlug), map((gradeListJson: any) => gradeListJson.map(deserializeGrade)));
  }


}
