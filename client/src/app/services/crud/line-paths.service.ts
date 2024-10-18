import { Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { LinePath } from '../../models/line-path';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ItemOrder } from '../../interfaces/item-order.interface';

/**
 * CRUD service for line paths.
 */
@Injectable({
  providedIn: 'root',
})
export class LinePathsService {
  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

  /**
   * Adds a LinePath to a topo image.
   *
   * @param linePath LinePath to persist.
   * @param topoImageId ID of the topo image to which the line path should be added.
   * @return Observable of a LinePath.
   */
  public addLinePath(
    linePath: LinePath,
    topoImageId: string,
  ): Observable<LinePath> {
    return this.http
      .post(
        this.api.linePaths.addLinePath(topoImageId),
        LinePath.serialize(linePath),
      )
      .pipe(map(LinePath.deserialize));
  }

  /**
   * Deletes a LinePath.
   *
   * @param linePath LinePath to delete.
   * @return Observable of null.
   */
  public deleteLinePath(linePath: LinePath): Observable<null> {
    return this.http
      .delete(this.api.linePaths.delete(linePath.id))
      .pipe(map(() => null));
  }

  /**
   * Updates the order of the line paths for a topo image.
   *
   * @param newOrder Sector order.
   * @param topoImageId ID of the topo image the line paths are in.
   * @return Observable of null.
   */
  public updateLinePathOrder(
    newOrder: ItemOrder,
    topoImageId: string,
  ): Observable<null> {
    return this.http
      .put(this.api.linePaths.updateOrder(topoImageId), newOrder)
      .pipe(map(() => null));
  }

  /**
   * Updates the order of the line paths for a line.
   *
   * @param newOrder Sector order.
   * @param lineSlug Slug of the line that the line paths are in.
   * @return Observable of null.
   */
  public updateLinePathOrderForLines(
    newOrder: ItemOrder,
    lineSlug: string,
  ): Observable<null> {
    return this.http
      .put(this.api.linePaths.updateOrderForLines(lineSlug), newOrder)
      .pipe(map(() => null));
  }
}
