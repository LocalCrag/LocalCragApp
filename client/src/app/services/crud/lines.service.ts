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

  /**
   * Returns a list of Lines.
   *
   * @param areaSlug Slug if the area to return the lines for.
   * @return Observable of a list of Lines.
   */
  public getLines(areaSlug: string): Observable<Line[]> {
    return this.http.get(this.api.lines.getList(areaSlug)).pipe(map((lineListJson: any) => {
      const lines = lineListJson.map(Line.deserialize);
      return getSortedLines(lines);
    }));
  }

  public getLinesNew(filters: string): Observable<Paginated<Line>> {
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

/**
 * Sorts an array of lines by their primary topo image and the topo images order. Lines without topo images come
 * last.
 * @param lines Lines to sort.
 */
const getSortedLines = (lines: Line[]): Line[] => {
  const sortedLines = lines.sort((l1, l2) => {
    if (l1.topoImages.length === 0 && l2.topoImages.length === 0) {
      return 0;
    }
    if (l1.topoImages.length === 0) {
      return 1;
    }
    if (l2.topoImages.length === 0) {
      return -1;
    }
    if (l1.topoImages[0].orderIndex > l2.topoImages[0].orderIndex) {
      return 1;
    }
    if (l1.topoImages[0].orderIndex < l2.topoImages[0].orderIndex) {
      return -1;
    }
    if (l1.topoImages[0].linePaths[0].orderIndex > l2.topoImages[0].linePaths[0].orderIndex) {
      return 1;
    }
    if (l1.topoImages[0].linePaths[0].orderIndex < l2.topoImages[0].linePaths[0].orderIndex) {
      return -1;
    }
    return 0;
  });
  sortedLines.map((line, orderIndex) => {
    line.blockOrderIndex = orderIndex
  })
  return sortedLines;
}
