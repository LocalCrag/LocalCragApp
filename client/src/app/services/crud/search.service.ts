import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {CacheService} from '../core/cache.service';
import {Observable} from 'rxjs';
import {Ranking} from '../../models/ranking';
import {map} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {Searchable} from '../../models/searchable';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  constructor(private api: ApiService,
              private http: HttpClient) {
  }

  public search(query: string): Observable<Searchable[]> {
    return this.http.get(this.api.search.search(query)).pipe(map((searchListJson: any) => searchListJson.map(Searchable.deserialize)));
  }

}
