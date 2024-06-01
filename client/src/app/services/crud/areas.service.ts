import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {Area} from '../../models/area';
import {ItemOrder} from '../../interfaces/item-order.interface';
import {deserializeGrade, Grade} from '../../utility/misc/grades';
import {reloadMenus} from '../../ngrx/actions/core.actions';
import {Store} from '@ngrx/store';

/**
 * CRUD service for areas.
 */
@Injectable({
  providedIn: 'root'
})
export class AreasService {

  constructor(private api: ApiService,
              private store: Store,
              private http: HttpClient) {
  }

  /**
   * Creates an Area.
   *
   * @param area Area to persist.
   * @param sectorSlug Slug of the sector to create the area in.
   * @return Observable of a Crag.
   */
  public createArea(area: Area, sectorSlug: string): Observable<Area> {
    return this.http.post(this.api.areas.create(sectorSlug), Area.serialize(area)).pipe(
      tap(() => {
        this.store.dispatch(reloadMenus());
      }),
      map(Area.deserialize)
    );
  }

  /**
   * Returns a list of Areas.
   *
   * @param sectorSlug Slug if the sector to return the areas for.
   * @return Observable of a list of Areas.
   */
  public getAreas(sectorSlug: string): Observable<Area[]> {
    return this.http.get(this.api.areas.getList(sectorSlug)).pipe(map((areaListJson: any) => areaListJson.map(Area.deserialize)));
  }

  /**
   * Returns an Area.
   *
   * @param slug Slug of the Area to load.
   * @return Observable of an Area.
   */
  public getArea(slug: string): Observable<Area> {
    return this.http.get(this.api.areas.getDetail(slug)).pipe(map(Area.deserialize));
  }

  /**
   * Deletes an Area.
   *
   * @param area Area to delete.
   * @return Observable of an Area.
   */
  public deleteArea( area: Area): Observable<null> {
    return this.http.delete(this.api.areas.delete(area.slug)).pipe(
      tap(() => {
        this.store.dispatch(reloadMenus());
      }),
      map(() => null)
    );
  }

  /**
   * Updates an Area.
   *
   * @param area Area to persist.
   * @return Observable of null.
   */
  public updateArea( area: Area): Observable<Area> {
    return this.http.put(this.api.areas.update(area.slug), Area.serialize(area)).pipe(
      tap(() => {
        this.store.dispatch(reloadMenus());
      }),
      map(Area.deserialize)
    );
  }

  /**
   * Updates the order of the areas for a sector.
   *
   * @param newOrder Area order.
   * @param sectorSlug Slug of the sector the areas are in.
   * @return Observable of null.
   */
  public updateAreaOrder(newOrder: ItemOrder, sectorSlug: string): Observable<null> {
    return this.http.put(this.api.areas.updateOrder(sectorSlug), newOrder).pipe(
      tap(() => {
        this.store.dispatch(reloadMenus());
      }),
      map(() => null)
    );
  }

  /**
   * Returns a list of Grades.
   *
   * @param areaSlug Slug of the area to return the grades for.
   * @return Observable of a list of Grades.
   */
  public getAreaGrades(areaSlug: string): Observable<Grade[]> {
    return this.http.get(this.api.areas.getGrades(areaSlug)).pipe(map((gradeListJson: any) => gradeListJson.map(deserializeGrade)));
  }

}
