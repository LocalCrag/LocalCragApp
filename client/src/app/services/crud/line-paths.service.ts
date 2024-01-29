import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {CacheService} from '../../cache/cache.service';
import {HttpClient} from '@angular/common/http';
import {LinePath} from '../../models/line-path';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';


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
        return this.http.post(this.api.topoImages.addLinePath(topoImageId), LinePath.serialize(linePath)).pipe(
            tap(() => {
                this.cache.clear(this.api.topoImages.getList(areaSlug))
            }),
            map(LinePath.deserialize)
        );
    }

    /**
     * Deletes a LinePath.
     *
     * @param areaSlug Slug of the area the line path is in.
     * @param linePath LinePath to delete.
     * @return Observable of null.
     */
    public deleteLinePath(areaSlug: string, linePath: LinePath): Observable<null> {
        return this.http.delete(this.api.linePaths.delete(linePath.id)).pipe(
            tap(() => {
                this.cache.clear(this.api.topoImages.getList(areaSlug))
            }),
            map(() => null)
        );
    }

}
