import { Injectable } from '@angular/core';
import {ApiService} from '../core/api.service';
import {CacheService} from '../../cache/cache.service';
import {HttpClient} from '@angular/common/http';
import {Area} from '../../models/area';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {Line} from '../../models/line';

/**
 * CRUD service for lines.
 */
@Injectable({
  providedIn: 'root'
})
export class LinesService {

  constructor(private api: ApiService,
              private cache: CacheService,
              private http: HttpClient) {
  }

  /**
   * Creates a Line.
   *
   * @param line Line to persist.
   * @param areaSlug Slug of the area to create the line in.
   * @return Observable of a Crag.
   */
  public createLine(line: Line, areaSlug: string): Observable<Line> {
    return this.http.post(this.api.lines.create(areaSlug), Line.serialize(line)).pipe(
      tap(() => {
        this.cache.clear(this.api.lines.getList(areaSlug));
      }),
      map(Line.deserialize)
    );
  }

  /**
   * Returns a list of Lines.
   *
   * @param areaSlug Slug if the area to return the lines for.
   * @return Observable of a list of Lines.
   */
  public getLines(areaSlug: string): Observable<Line[]> {
    return this.cache.get(this.api.lines.getList(areaSlug), map((lineListJson: any) => lineListJson.map(Line.deserialize)));
  }

  /**
   * Returns a Line.
   *
   * @param slug Slug of the Line to load.
   * @return Observable of a Line.
   */
  public getLine(slug: string): Observable<Line> {
    return this.cache.get(this.api.lines.getDetail(slug), map(Line.deserialize));
  }

  /**
   * Deletes a Line.
   *
   * @param areaSlug Slug of the area to delete the line from.
   * @param line Line to delete.
   * @return Observable of a Line.
   */
  public deleteLine(areaSlug: string, line: Line): Observable<null> {
    return this.http.delete(this.api.lines.delete(line.slug)).pipe(
      tap(() => {
        this.cache.clear(this.api.lines.getList(areaSlug));
      }),
      map(() => null)
    );
  }

  /**
   * Updates a Line.
   *
   * @param areaSlug Slug of the area that the line lives in.
   * @param line Line to persist.
   * @return Observable of null.
   */
  public updateLine(areaSlug: string, line: Line): Observable<Line> {
    return this.http.put(this.api.lines.update(line.slug), Line.serialize(line)).pipe(
      tap(() => {
        this.cache.clear(this.api.lines.getDetail(line.slug));
        this.cache.clear(this.api.lines.getList(areaSlug));
      }),
      map(Line.deserialize)
    );
  }

}
