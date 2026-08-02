import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FeatureCollection, Geometry } from 'geojson';
import { ApiService } from '../core/api.service';
import { RockExplorerFeature } from '../../models/rock-explorer-feature';

export interface RockExplorerFeatureFilters {
  potential?: string;
  rockQuality?: string;
  rockType?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RockExplorerService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  public getFeaturesGeoJSON(
    filters: RockExplorerFeatureFilters = {},
  ): Observable<FeatureCollection<Geometry>> {
    return this.http.get<FeatureCollection<Geometry>>(
      this.api.rockExplorer.getFeaturesGeoJSON(),
      { params: this.toParams(filters) },
    );
  }

  public getFeature(id: string): Observable<RockExplorerFeature> {
    return this.http
      .get(this.api.rockExplorer.getFeature(id))
      .pipe(map(RockExplorerFeature.deserialize));
  }

  public createFeature(
    feature: RockExplorerFeature,
  ): Observable<RockExplorerFeature> {
    return this.http
      .post(
        this.api.rockExplorer.createFeature(),
        RockExplorerFeature.serialize(feature),
      )
      .pipe(map(RockExplorerFeature.deserialize));
  }

  public updateFeature(
    feature: RockExplorerFeature,
  ): Observable<RockExplorerFeature> {
    return this.http
      .put(
        this.api.rockExplorer.updateFeature(feature.id),
        RockExplorerFeature.serialize(feature),
      )
      .pipe(map(RockExplorerFeature.deserialize));
  }

  public deleteFeature(feature: RockExplorerFeature): Observable<null> {
    return this.http
      .delete(this.api.rockExplorer.deleteFeature(feature.id))
      .pipe(map(() => null));
  }

  private toParams(filters: RockExplorerFeatureFilters): HttpParams {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null && value !== '') {
        params = params.set(key, value);
      }
    });
    return params;
  }
}
