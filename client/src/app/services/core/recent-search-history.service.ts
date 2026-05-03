import { inject, Injectable } from '@angular/core';
import { Searchable } from '../../models/searchable';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RecentSearchHistoryService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  getRecent(): Observable<Searchable[]> {
    return this.http
      .get<unknown[]>(this.api.account.getRecentSearches())
      .pipe(
        map((entries) => entries.map((entry) => Searchable.deserialize(entry))),
      );
  }

  recordSelection(searchable: Searchable): void {
    const payload = toRecentSearchPayload(searchable);
    if (!payload) return;
    this.http
      .post(this.api.account.createRecentSearch(), payload)
      .pipe(catchError(() => of(null)))
      .subscribe();
  }
}

function toRecentSearchPayload(
  searchable: Searchable,
): { objectType: string; objectId: string } | null {
  if (searchable.line)
    return { objectType: 'Line', objectId: searchable.line.id };
  if (searchable.area)
    return { objectType: 'Area', objectId: searchable.area.id };
  if (searchable.sector)
    return { objectType: 'Sector', objectId: searchable.sector.id };
  if (searchable.crag)
    return { objectType: 'Crag', objectId: searchable.crag.id };
  if (searchable.user)
    return { objectType: 'User', objectId: searchable.user.id };
  return null;
}
