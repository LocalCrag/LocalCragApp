import { Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { LineType } from '../../enums/line-type';
import { FullScale, Scale } from '../../models/scale';
import { marker } from '@jsverse/transloco-keys-manager/marker';

// LineType -> scaleName -> [gradeNamesToValues, gradeValuesToNames, scale]
const CACHE: Record<LineType,
                    Record<string, [
                      Record<string, number>,
                      Record<number, string>,
                      FullScale
                    ]>> = {
  [LineType.BOULDER]: {},
  [LineType.SPORT]: {},
  [LineType.TRAD]: {},
};

const OPEN_REQUESTS: Record<LineType, Record<string, Observable<FullScale>>> = {
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

  public getScale(lineType: LineType, name: string): Observable<FullScale> {
    if (CACHE[lineType][name]) {
      return of(CACHE[lineType][name][2]);
    }

    // Prevent parallel requests to the same endpoint
    if (OPEN_REQUESTS[lineType][name]) {
      return OPEN_REQUESTS[lineType][name];
    }

    const req = this.http
      .get(this.api.scales.get(lineType, name))
      .pipe(
        map((payload) => Scale.deserializeFull(payload)),
        map((scale) => this.updateCache(scale)),
        map((scale) => {
          delete OPEN_REQUESTS[lineType][name];
          return scale;
        }),
      );

    OPEN_REQUESTS[lineType][name] = req;
    return req;
  }

  public getScales(): Observable<Scale[]> {
    return this.http
      .get(this.api.scales.getList())
      .pipe(
        map((payload) => (payload as Array<any>).map((p) => Scale.deserialize(p))),
      );
  }

  public createScale(scale: Scale): Observable<FullScale> {
    return this.http
      .post(this.api.scales.create(), Scale.serialize(scale))
      .pipe(map(Scale.deserializeFull), map((scale) => this.updateCache(scale)),);
  }

  public updateScale(scale: Scale): Observable<FullScale> {
    return this.http
      .put(this.api.scales.update(scale.lineType, scale.name), Scale.serialize(scale))
      .pipe(map(Scale.deserializeFull), map((scale) => this.updateCache(scale)),);
  }

  public deleteScale(scale: Scale): Observable<null> {
    return this.http
      .delete(this.api.scales.delete(scale.lineType, scale.name))
      .pipe(map(() => delete CACHE[scale.lineType][scale.name]), map(() => null));
  }

  public gradeNameByValue(lineType?: LineType, name?: string, value?: number): Observable<string> {
    if (!lineType || !name || typeof value !== "number") {
      // Convenience case to allow use of function in eventually-initialized locations
      return of("");
    }

    if (CACHE[lineType][name]) {
      return of(CACHE[lineType][name][1][value]);
    }
    return this.getScale(lineType, name).pipe(map(() => CACHE[lineType][name][1][value]));
  }

  public gradeNameByValueMap(lineType: LineType, name: string): Observable<Record<number, string>> {
    if (CACHE[lineType][name]) {
      return of(CACHE[lineType][name][1]);
    }
    return this.getScale(lineType, name).pipe(map(() => CACHE[lineType][name][1]));
  }

  private updateCache(scale: FullScale) {
    const gradeValueByName: Record<string, number> = {};
    const gradeNameByValue: Record<number, string> = {};

    for (const grade of scale.grades) {
      gradeValueByName[grade.name] = grade.value;
      gradeNameByValue[grade.value] = grade.name;
    }

    CACHE[scale.lineType][scale.name] = [gradeValueByName, gradeNameByValue, scale];
    return scale;
  }

  public getFormScaleSelectors<T>(listInitializer: {label: string, value: T | string}[]) {
    return this.getScales().pipe(map(scales => {
      const boulderScales = listInitializer.slice();
      const sportScales = listInitializer.slice();
      const tradScales = listInitializer.slice();

      scales.forEach(scale => {
        switch (scale.lineType) {
          case LineType.BOULDER:
            boulderScales.push({label: scale.name, value: scale.name});
            break;
          case LineType.SPORT:
            sportScales.push({label: scale.name, value: scale.name});
            break;
          case LineType.TRAD:
            tradScales.push({label: scale.name, value: scale.name});
        }
      });

      return {
        [LineType.BOULDER]: boulderScales,
        [LineType.SPORT]: sportScales,
        [LineType.TRAD]: tradScales,
      };
    }));
  }
}
