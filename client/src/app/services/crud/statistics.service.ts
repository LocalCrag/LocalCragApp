import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Completion } from '../../models/statistics';

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  public getCompletion(filters: string): Observable<Completion> {
    return this.http.get(
      this.api.statistics.completion(filters),
    ) as Observable<Completion>;
  }
}
