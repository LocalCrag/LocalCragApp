import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { TopoStatistics } from '../../models/topo-statistics';

@Injectable({
  providedIn: 'root',
})
export class TopoStatisticsService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  public get(objectType: string, slug?: string): Observable<TopoStatistics> {
    return this.http.get<TopoStatistics>(
      this.api.statistics.topo(objectType, slug),
    );
  }
}
