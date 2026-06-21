import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Completion } from '../../models/statistics';
import {
  ApiQueryParams,
  httpGetOptions,
} from '../../utility/http/query-params';

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  public getCompletion(params: ApiQueryParams): Observable<Completion> {
    return this.http.get(
      this.api.statistics.completion(),
      httpGetOptions(params),
    ) as Observable<Completion>;
  }
}
