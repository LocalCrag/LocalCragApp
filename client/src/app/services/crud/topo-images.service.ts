import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {CacheService} from '../core/cache.service';
import {HttpClient} from '@angular/common/http';
import {TopoImage} from '../../models/topo-image';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {LinePath} from '../../models/line-path';
import {Crag} from '../../models/crag';
import {ItemOrder} from '../../interfaces/item-order.interface';
import {environment} from '../../../environments/environment';
import {reloadCrags} from '../../ngrx/actions/core.actions';

/**
 * CRUD service for topo images.
 */
@Injectable({
    providedIn: 'root'
})
export class TopoImagesService {

    constructor(private api: ApiService,
                private cache: CacheService,
                private http: HttpClient) {
    }

    /**
     * Adds a TopoImage to an area.
     *
     * @param topoImage TopoImage to persist.
     * @param areaSlug Slug of the area to add the topo image in.
     * @return Observable of a TopoImage.
     */
    public addTopoImage(topoImage: TopoImage, areaSlug: string): Observable<TopoImage> {
        return this.http.post(this.api.topoImages.add(areaSlug), TopoImage.serialize(topoImage)).pipe(
            tap(() => {
                this.cache.clear(this.api.topoImages.getList(areaSlug))
            }),
            map(TopoImage.deserialize)
        );
    }

  /**
   * Updates a TopoImage.
   *
   * @param topoImage TopoImage to persist.
   * @param areaSlug Slug of the area the topo image is in.
   * @return Observable of null.
   */
  public updateTopoImage(topoImage: TopoImage, areaSlug: string): Observable<TopoImage> {
    return this.http.put(this.api.topoImages.update(topoImage.id), TopoImage.serialize(topoImage)).pipe(
      tap(() => {
        this.cache.clear(this.api.topoImages.getList(areaSlug))
        this.cache.clear(this.api.topoImages.getDetail(topoImage.id))
      }),
      map(TopoImage.deserialize)
    );
  }

    /**
     * Returns a list of TopoImages for an area.
     * @param areaSlug Slug of the area to get the topo images for.
     * @return Observable of a list of TopoImages.
     */
    public getTopoImages(areaSlug: string): Observable<TopoImage[]> {
        return this.cache.get(this.api.topoImages.getList(areaSlug), map((topoImageListJson: any) => topoImageListJson.map(TopoImage.deserialize)))
    }

    /**
     * Returns a TopoImage.
     *
     * @param id ID of the TopoImage to load.
     * @return Observable of a TopoImage.
     */
    public getTopoImage(id: string): Observable<TopoImage> {
        return this.cache.get(this.api.topoImages.getDetail(id), map(TopoImage.deserialize));
    }

    /**
     * Deletes a TopoImage.
     *
     * @param areaSlug Slug of the area the topo image is in.
     * @param topoImage TopoImage to delete.
     * @return Observable of null.
     */
    public deleteTopoImage(areaSlug: string, topoImage: TopoImage): Observable<null> {
        return this.http.delete(this.api.topoImages.delete(topoImage.id)).pipe(
            tap(() => {
                this.cache.clear(this.api.topoImages.getList(areaSlug))
            }),
            map(() => null)
        );
    }

  /**
   * Updates the order of the topo images for an area.
   *
   * @param newOrder Sector order.
   * @param areaSlug Slug of the area the topo images are in.
   * @return Observable of null.
   */
  public updateTopoImageOrder(newOrder: ItemOrder, areaSlug: string): Observable<null> {
    return this.http.put(this.api.topoImages.updateOrder(areaSlug), newOrder).pipe(
      tap(() => {
        this.cache.clear(this.api.topoImages.getList(areaSlug));
        this.cache.clear(this.api.lines.getList(areaSlug));
      }),
      map(() => null)
    );
  }

}
