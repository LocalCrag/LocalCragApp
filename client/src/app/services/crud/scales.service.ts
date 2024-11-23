import { Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { LineType } from '../../enums/line-type';
import { Scale } from '../../models/scale';

// LineType -> scaleName -> [gradeNamesToValues, gradeValuesToNames]
const CACHE: Record<LineType,
                    Record<string, [
                      Record<string, number>,
                      Record<number, string>
                    ]>> = {
  [LineType.BOULDER]: {},
  [LineType.SPORT]: {},
  [LineType.TRAD]: {},
};

@Injectable({
  providedIn: 'root',
})
export class ScalesService {
  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

  public getScale(lineType: LineType, name: string): Observable<Required<Scale>> {
    return this.http
      .get(this.api.scales.get(lineType, name))
      .pipe(
        map((payload) => Scale.deserializeFull(payload)),
        map((scale) => this.updateCache(scale)),
      );
  }

  public getScales(): Observable<Scale[]> {
    return this.http
      .get(this.api.scales.getList())
      .pipe(
        map((payload) => (payload as Array<any>).map((p) => Scale.deserialize(p))),
      );
  }

  public createScale(scale: Scale): Observable<Scale> {
    return this.http
      .post(this.api.scales.create(), Scale.serialize(scale))
      .pipe(map(Scale.deserialize), map((scale) => this.updateCache(scale)),);
  }

  public updateScale(scale: Scale): Observable<Scale> {
    return this.http
      .put(this.api.scales.update(scale.lineType, scale.name), Scale.serialize(scale))
      .pipe(map(Scale.deserialize), map((scale) => this.updateCache(scale)),);
  }

  public deleteScale(scale: Scale): Observable<null> {
    return this.http
      .delete(this.api.scales.delete(scale.lineType, scale.name))
      .pipe(map(() => delete CACHE[scale.lineType][scale.name]), map(() => null));
  }

  public gradeNameByValue(lineType?: LineType, name?: string, value?: number): Observable<string> {
    if (!lineType || !name || typeof value !== "number") {
      // Convenience case to allow use of function in eventually-initialized locations
      console.warn("Warning: Eventually initialized usage")
      return of("");
    }

    if (CACHE[lineType][name]) {
      return of(CACHE[lineType][name][1][value]);
    }
    return this.getScale(lineType, name).pipe(map(() => CACHE[lineType][name][1][value]));
  }

  private updateCache<T extends Scale>(scale: T) {
    const gradeValueByName: Record<string, number> = {};
    const gradeNameByValue: Record<number, string> = {};

    for (const grade of scale.grades) {
      gradeValueByName[grade.name] = grade.value;
      gradeNameByValue[grade.value] = grade.name;
    }

    CACHE[scale.lineType][scale.name] = [gradeValueByName, gradeNameByValue];
    return scale;
  }
}
