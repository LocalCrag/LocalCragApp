import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Searchable } from '../../models/searchable';
import { ObjectType } from '../../models/object';

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
    // If an object type is given, attach it as query param to restrict the searched type of objects
    if (objectType) {
      const params = new URLSearchParams({
        objectType,
      });
      query = query + '?' + params.toString();
    }

    return this.http
      .get(this.api.search.search(query))
      .pipe(
        map((searchListJson: any) =>
          searchListJson.map(Searchable.deserialize),
        ),
      );
  }
}
