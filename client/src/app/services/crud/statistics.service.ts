import { Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Store } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Completion } from '../../models/statistics';

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  constructor(
    private api: ApiService,
    private store: Store,
    private http: HttpClient,
  ) {}

  public getCompletion(filters: string): Observable<Completion> {
    return this.http.get(
      this.api.statistics.completion(filters),
    ) as Observable<Completion>;
  }
}
