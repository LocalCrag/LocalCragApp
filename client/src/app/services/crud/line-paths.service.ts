import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {CacheService} from '../../cache/cache.service';
import {HttpClient} from '@angular/common/http';
import {LinePath} from '../../models/line-path';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {ItemOrder} from '../../interfaces/item-order.interface';


/**
 * CRUD service for line paths.
 */
@Injectable({
  providedIn: 'root'
})
export class LinePathsService {

  constructor(private api: ApiService,
              private cache: CacheService,
              private http: HttpClient) {
  }

  /**
   * Adds a LinePath to a topo image.
   *
   * @param linePath LinePath to persist.
   * @param topoImageId ID of the topo image to which the line path should be added.
   * @param areaSlug Slug of the area the topo image is in.
   * @return Observable of a LinePath.
   */
  public addLinePath(linePath: LinePath, topoImageId: string, areaSlug: string): Observable<LinePath> {
    return this.http.post(this.api.linePaths.addLinePath(topoImageId), LinePath.serialize(linePath)).pipe(
      tap(() => {
        this.cache.clear(this.api.topoImages.getList(areaSlug));
        this.cache.clear(this.api.topoImages.getDetail(topoImageId));
      }),
      map(LinePath.deserialize)
    );
  }

  /**
   * Deletes a LinePath.
   *
   * @param areaSlug Slug of the area the line path is in.
   * @param topoImageId ID of the topo image that the line is part of.
   * @param linePath LinePath to delete.
   * @return Observable of null.
   */
  public deleteLinePath(areaSlug: string, linePath: LinePath, topoImageId: string): Observable<null> {
    return this.http.delete(this.api.linePaths.delete(linePath.id)).pipe(
      tap(() => {
        this.cache.clear(this.api.lines.getList(areaSlug));
        this.cache.clear(this.api.topoImages.getList(areaSlug));
        this.cache.clear(this.api.topoImages.getDetail(topoImageId));
      }),
      map(() => null)
    );
  }

  /**
   * Updates the order of the line paths for a topo image.
   *
   * @param newOrder Sector order.
   * @param topoImageId ID of the topo image the line paths are in.
   * @return Observable of null.
   */
  public updateLinePathOrder(newOrder: ItemOrder, topoImageId: string): Observable<null> {
    return this.http.put(this.api.linePaths.updateOrder(topoImageId), newOrder).pipe(
      tap(() => {
        this.cache.clear(this.api.topoImages.getDetail(topoImageId));
      }),
      map(() => null)
    );
  }

}
