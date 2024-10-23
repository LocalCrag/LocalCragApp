import { Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Searchable } from '../../models/searchable';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

  public search(query: string): Observable<Searchable[]> {
    return this.http
      .get(this.api.search.search(query))
      .pipe(
        map((searchListJson: any) =>
          searchListJson.map(Searchable.deserialize),
        ),
      );
  }
}
