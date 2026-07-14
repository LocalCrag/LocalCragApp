import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Searchable } from '../../models/searchable';
import { ObjectType } from '../../models/object';
import { httpGetOptions } from '../../utility/http/query-params';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  public search(
    query: string,
    objectType?: ObjectType,
  ): Observable<Searchable[]> {
    return this.http
      .get(
        this.api.search.search(query),
        httpGetOptions(objectType ? { objectType } : undefined),
      )
      .pipe(
        map((searchListJson: any) =>
          searchListJson.map(Searchable.deserialize),
        ),
      );
  }
}
