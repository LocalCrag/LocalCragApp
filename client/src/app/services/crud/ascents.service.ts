import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Ascent } from '../../models/ascent';
import { Paginated } from '../../models/paginated';
import {
  ApiQueryParams,
  httpGetOptions,
} from '../../utility/http/query-params';

@Injectable({
  providedIn: 'root',
})
export class AscentsService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  public getAscents(params: ApiQueryParams): Observable<Paginated<Ascent>> {
    return this.http
      .get(this.api.ascents.getList(), httpGetOptions(params))
      .pipe(
        map((payload) => Paginated.deserialize(payload, Ascent.deserialize)),
      );
  }

  public createAscent(ascent: Ascent): Observable<Ascent> {
    return this.http
      .post(this.api.ascents.create(), Ascent.serialize(ascent))
      .pipe(map(Ascent.deserialize));
  }

  public updateAscent(ascent: Ascent): Observable<Ascent> {
    return this.http
      .put(this.api.ascents.update(ascent.id), Ascent.serialize(ascent))
      .pipe(map(Ascent.deserialize));
  }

  public clearAscentFa(ascentId: string): Observable<Ascent> {
    return this.http
      .post(this.api.ascents.clearFa(ascentId), {})
      .pipe(map(Ascent.deserialize));
  }

  public deleteAscent(ascent: Ascent): Observable<null> {
    return this.http
      .delete(this.api.ascents.delete(ascent.id))
      .pipe(map(() => null));
  }

  public sendProjectClimbedMessage(
    message: string,
    lineId: string,
  ): Observable<null> {
    return this.http
      .post(this.api.ascents.sendProjectClimbedMessage(), {
        message,
        line: lineId,
      })
      .pipe(map(() => null));
  }
}
