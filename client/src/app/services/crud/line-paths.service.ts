import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { LinePath } from '../../models/line-path';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ItemOrder } from '../../interfaces/item-order.interface';

/**
 * CRUD service for line paths.
 */
@Injectable({
  providedIn: 'root',
})
export class LinePathsService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  /**
   * Syncs all line paths for a topo image in one request.
   *
   * @param linePaths Line paths to persist in display order.
   * @param topoImageId ID of the topo image.
   * @return Observable of synced LinePaths.
   */
  public syncLinePaths(
    linePaths: LinePath[],
    topoImageId: string,
  ): Observable<LinePath[]> {
    return this.http
      .put<any[]>(
        this.api.linePaths.sync(topoImageId),
        LinePath.serializeForSync(linePaths),
      )
      .pipe(map((payload) => payload.map(LinePath.deserialize)));
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
