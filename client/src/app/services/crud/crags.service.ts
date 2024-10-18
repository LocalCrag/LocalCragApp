import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {Crag} from '../../models/crag';
import {HttpClient} from '@angular/common/http';
import {ItemOrder} from '../../interfaces/item-order.interface';
import {Store} from '@ngrx/store';
import {reloadMenus} from '../../ngrx/actions/core.actions';
import {deserializeGrade, Grade} from '../../utility/misc/grades';

/**
 * CRUD service for crags.
 */
@Injectable({
  providedIn: 'root',
})
export class CragsService {
  constructor(
    private api: ApiService,
    private store: Store,
    private http: HttpClient,
  ) {}

  /**
   * Creates a Crag.
   *
   * @param crag Crag to persist.
   * @return Observable of a Crag.
   */
  public createCrag(crag: Crag): Observable<Crag> {
    return this.http.post(this.api.crags.create(), Crag.serialize(crag)).pipe(
      tap(() => {
        this.store.dispatch(reloadMenus());
      }),
      map(Crag.deserialize),
    );
  }

  /**
   * Returns a list of Crags.
   *
   * @return Observable of a list of Crags.
   */
  public getCrags(): Observable<Crag[]> {
    return this.http
      .get(this.api.crags.getList())
      .pipe(map((cragListJson: any) => cragListJson.map(Crag.deserialize)));
  }

  /**
   * Returns a Crag.
   *
   * @param slug Slug of the Crag to load.
   * @return Observable of a Crag.
   */
  public getCrag(slug: string): Observable<Crag> {
    return this.http
      .get(this.api.crags.getDetail(slug))
      .pipe(map(Crag.deserialize));
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
        this.store.dispatch(reloadMenus());
      }),
      map(() => null),
    );
  }

  /**
   * Updates a Crag.
   *
   * @param crag Crag to persist.
   * @return Observable of null.
   */
  public updateCrag(crag: Crag): Observable<Crag> {
    return this.http
      .put(this.api.crags.update(crag.slug), Crag.serialize(crag))
      .pipe(
        tap(() => {
          this.store.dispatch(reloadMenus());
        }),
        map(Crag.deserialize),
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
        this.store.dispatch(reloadMenus());
      }),
      map(() => null),
    );
  }

  /**
   * Returns a list of Grades.
   *
   * @param cragSlug Slug of the crag to return the grades for.
   * @return Observable of a list of Grades.
   */
  public getCragGrades(cragSlug: string): Observable<Grade[]> {
    return this.http
      .get(this.api.crags.getGrades(cragSlug))
      .pipe(map((gradeListJson: any) => gradeListJson.map(deserializeGrade)));
  }
}
