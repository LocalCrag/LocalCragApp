import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ControversyKind,
  RatingControversy,
  RatingControversyPage,
} from '../../models/rating-controversy';
import { httpGetOptions } from '../../utility/http/query-params';
import { ApiService } from '../core/api.service';

@Injectable({
  providedIn: 'root',
})
export class RatingControversiesService {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  list(
    page: number,
    perPage: number,
    kind: ControversyKind | null,
    minAscents: number,
  ): Observable<RatingControversyPage> {
    return this.http
      .get<RatingControversyPage>(
        this.api.ratingControversies.list(),
        httpGetOptions({ page, per_page: perPage, kind, minAscents }),
      )
      .pipe(map((payload) => deserializePage(payload)));
  }

  dismiss(
    lineId: string,
    kind: ControversyKind,
  ): Observable<{ dismissed: boolean }> {
    return this.http.post<{ dismissed: boolean }>(
      this.api.ratingControversies.dismiss(lineId),
      { kind },
    );
  }

  reset(confirmation: string): Observable<{ restarted: boolean }> {
    return this.http.post<{ restarted: boolean }>(
      this.api.ratingControversies.reset(),
      { confirmation },
    );
  }
}

function deserializePage(
  payload: RatingControversyPage,
): RatingControversyPage {
  return {
    items: (payload?.items ?? []).map(deserializeItem),
    hasNext: !!payload?.hasNext,
    kind:
      payload?.kind === 'grade' || payload?.kind === 'rating'
        ? payload.kind
        : null,
    compareGrades: !!payload?.compareGrades,
    compareRatings: !!payload?.compareRatings,
  };
}

function deserializeItem(raw: RatingControversy): RatingControversy {
  const crag = raw.crag;
  const sector = raw.sector;
  const area = raw.area;
  return {
    ...raw,
    authorRating: raw.authorRating ?? null,
    userRating: raw.userRating ?? null,
    routerLink: `/topo/${crag.slug}/${sector.slug}/${area.slug}/${raw.slug}`,
  };
}
