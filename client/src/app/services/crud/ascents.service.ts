import { Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Ascent } from '../../models/ascent';
import { Paginated } from '../../models/paginated';

@Injectable({
  providedIn: 'root',
})
export class AscentsService {
  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

  public getAscents(filters: string): Observable<Paginated<Ascent>> {
    return this.http
      .get(this.api.ascents.getList(filters))
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
