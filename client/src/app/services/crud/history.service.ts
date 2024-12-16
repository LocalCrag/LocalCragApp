import { Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paginated } from '../../models/paginated';
import { HistoryItem } from '../../models/history-item';

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

  public getHistory(filters: string): Observable<Paginated<HistoryItem>> {
    return this.http
      .get(this.api.history.getList(filters))
      .pipe(
        map((payload) =>
          Paginated.deserialize(payload, HistoryItem.deserialize),
        ),
      );
  }
}
