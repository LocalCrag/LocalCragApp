import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {Line} from '../../models/line';
import {Paginated} from '../../models/paginated';
import {Ascent} from '../../models/ascent';

/**
 * CRUD service for lines.
 */
@Injectable({
  providedIn: 'root'
})
export class LinesService {

  constructor(private api: ApiService,
              private http: HttpClient) {
  }

  /**
   * Creates a Line.
   *
   * @param line Line to persist.
   * @param areaSlug Slug of the area to create the line in.
   * @return Observable of a Line.
   */
  public createLine(line: Line, areaSlug: string): Observable<Line> {
    return this.http.post(this.api.lines.create(areaSlug), Line.serialize(line)).pipe(
      map(Line.deserialize)
    );
  }


  public getLines(filters: string): Observable<Paginated<Line>> {
    return this.http.get(this.api.lines.getListNew(filters)).pipe(map(payload => Paginated.deserialize(payload, Line.deserialize)));
  }

  /**
   * Returns a Line.
   *
   * @param slug Slug of the Line to load.
   * @return Observable of a Line.
   */
  public getLine(slug: string): Observable<Line> {
    return this.http.get(this.api.lines.getDetail(slug)).pipe(map(Line.deserialize));
  }

  /**
   * Deletes a Line.
   *
   * @param line Line to delete.
   * @return Observable of a Line.
   */
  public deleteLine(line: Line): Observable<null> {
    return this.http.delete(this.api.lines.delete(line.slug)).pipe(
      map(() => null)
    );
  }

  /**
   * Updates a Line.
   *
   * @param line Line to persist.
   * @return Observable of null.
   */
  public updateLine(line: Line): Observable<Line> {
    return this.http.put(this.api.lines.update(line.slug), Line.serialize(line)).pipe(
      map(Line.deserialize)
    );
  }

}

