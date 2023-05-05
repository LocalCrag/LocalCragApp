import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {Observable} from 'rxjs';
import {map, mapTo} from 'rxjs/operators';
import {Crag} from '../../models/crag';
import {HttpClient} from '@angular/common/http';

/**
 * CRUD service for crags.
 */
@Injectable({
  providedIn: 'root'
})
export class CragsService {

  constructor(private api: ApiService,
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
    return this.http.post(this.api.crags.create(regionId), Crag.serialize(crag)).pipe(map(Crag.deserialize));
  }

  /**
   * Returns a list of Crags.
   *
   * @return Observable of a list of Crags.
   */
  public getCrags(): Observable<Crag[]> {
    return this.http.get(this.api.crags.getList()).pipe(map((cragListJson: any) => cragListJson.map(Crag.deserialize)));
  }

  /**
   * Returns a Crag.
   *
   * @param id: ID of the Crag to load.
   * @return Observable of a Crag.
   */
  public getCrag(id: string): Observable<Crag> {
    return this.http.get(this.api.crags.getDetail(id)).pipe(map(Crag.deserialize));
  }

  /**
   * Deletes a Crag.
   *
   * @param crag Crag to delete.
   * @return Observable of a Crag.
   */
  public deleteCrag(crag: Crag): Observable<null> {
    return this.http.delete(this.api.crags.delete(crag.id)).pipe(map(() => null));
  }

  /**
   * Updates a Crag.
   *
   * @param crag Crag to persist.
   * @return Observable of null.
   */
  public updateCrag(crag: Crag): Observable<Crag> {
    return this.http.put(
      this.api.crags.update(crag.id),
      Crag.serialize(crag)).pipe(map(Crag.deserialize)
    );
  }

}
