import { Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Line } from '../../models/line';
import { TopoImage } from '../../models/topo-image';

/**
 * CRUD service for the batch editor.
 */
@Injectable({
  providedIn: 'root',
})
export class BatchEditorService {
  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

  public batchCreateLines(
    payload: any,
    areaSlug: string,
  ): Observable<{ lines: Line[]; topoImages: TopoImage[] }> {
    return this.http.post(this.api.areas.batchCreate(areaSlug), payload).pipe(
      map((res) => {
        return {
          lines: res['lines'].map(Line.deserialize),
          topoImages: res['topoImages'].map(TopoImage.deserialize),
        };
      }),
    );
  }
}
