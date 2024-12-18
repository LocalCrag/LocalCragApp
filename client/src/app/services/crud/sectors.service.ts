import { Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Sector } from '../../models/sector';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ItemOrder } from '../../interfaces/item-order.interface';
import { Store } from '@ngrx/store';
import { reloadMenus } from '../../ngrx/actions/core.actions';
import { deserializeGradeList, GradeDistribution } from '../../models/scale';

/**
 * CRUD service for sectors.
 */
@Injectable({
  providedIn: 'root',
})
export class SectorsService {
  constructor(
    private api: ApiService,
    private store: Store,
    private http: HttpClient,
  ) {}

  /**
   * Creates a Sector.
   *
   * @param sector Sector to persist.
   * @param cragSlug Slug of the crag to create the sector in.
   * @return Observable of a Sector.
   */
  public createSector(sector: Sector, cragSlug: string): Observable<Sector> {
    return this.http
      .post(this.api.sectors.create(cragSlug), Sector.serialize(sector))
      .pipe(
        tap(() => {
          this.store.dispatch(reloadMenus());
        }),
        map(Sector.deserialize),
      );
  }

  /**
   * Returns a list of Sectors for a crag.
   * @param cragSlug Slug of the crag to get the sectors for.
   * @return Observable of a list of Sectors.
   */
  public getSectors(cragSlug: string): Observable<Sector[]> {
    return this.http
      .get(this.api.sectors.getList(cragSlug))
      .pipe(
        map((sectorListJson: any) => sectorListJson.map(Sector.deserialize)),
      );
  }

  /**
   * Returns a Sector.
   *
   * @param sectorSlug Slug of the Sector to load.
   * @return Observable of a Sector.
   */
  public getSector(sectorSlug: string): Observable<Sector> {
    return this.http
      .get(this.api.sectors.getDetail(sectorSlug))
      .pipe(map(Sector.deserialize));
  }

  /**
   * Deletes a Sector.
   *
   * @param sector Sector to delete.
   * @return Observable of null.
   */
  public deleteSector(sector: Sector): Observable<null> {
    return this.http.delete(this.api.sectors.delete(sector.slug)).pipe(
      tap(() => {
        this.store.dispatch(reloadMenus());
      }),
      map(() => null),
    );
  }

  /**
   * Updates a Sector.
   *
   * @param sector Sector to persist.
   * @return Observable of a Sector.
   */
  public updateSector(sector: Sector): Observable<Sector> {
    return this.http
      .put(this.api.sectors.update(sector.slug), Sector.serialize(sector))
      .pipe(
        tap(() => {
          this.store.dispatch(reloadMenus());
        }),
        map(Sector.deserialize),
      );
  }

  /**
   * Updates the order of the sectors for a crag.
   *
   * @param newOrder Sector order.
   * @param cragSlug Slug of the crag the sectors are in.
   * @return Observable of null.
   */
  public updateSectorOrder(
    newOrder: ItemOrder,
    cragSlug: string,
  ): Observable<null> {
    return this.http.put(this.api.sectors.updateOrder(cragSlug), newOrder).pipe(
      tap(() => {
        this.store.dispatch(reloadMenus());
      }),
      map(() => null),
    );
  }

  /**
   * Returns a list of Grades.
   *
   * @param sectorSlug Slug of the sector to return the grades for.
   * @return Observable of a list of Grades.
   */
  public getSectorGrades(sectorSlug: string): Observable<GradeDistribution> {
    return this.http
      .get(this.api.sectors.getGrades(sectorSlug))
      .pipe(map(deserializeGradeList));
  }
}
