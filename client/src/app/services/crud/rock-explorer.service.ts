import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FeatureCollection, Geometry } from 'geojson';
import { ApiService } from '../core/api.service';
import { RockExplorerFeature } from '../../models/rock-explorer-feature';
import { RockExplorerCluster } from '../../models/rock-explorer-cluster';

export interface RockExplorerFeatureFilters {
  potential?: string;
  rockQuality?: string;
  rockType?: string;
  clusterId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RockExplorerService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  public getFeatures(
    filters: RockExplorerFeatureFilters = {},
  ): Observable<RockExplorerFeature[]> {
    return this.http
      .get(this.api.rockExplorer.getFeatures(), {
        params: this.toParams(filters),
      })
      .pipe(
        map((list: any) =>
          (list as any[]).map(RockExplorerFeature.deserialize),
        ),
      );
  }

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

  public getClusters(): Observable<RockExplorerCluster[]> {
    return this.http
      .get(this.api.rockExplorer.getClusters())
      .pipe(
        map((list: any) =>
          (list as any[]).map(RockExplorerCluster.deserialize),
        ),
      );
  }

  public getCluster(id: string): Observable<RockExplorerCluster> {
    return this.http
      .get(this.api.rockExplorer.getCluster(id))
      .pipe(map(RockExplorerCluster.deserialize));
  }

  public createCluster(
    cluster: RockExplorerCluster,
  ): Observable<RockExplorerCluster> {
    return this.http
      .post(
        this.api.rockExplorer.createCluster(),
        RockExplorerCluster.serialize(cluster),
      )
      .pipe(map(RockExplorerCluster.deserialize));
  }

  public updateCluster(
    cluster: RockExplorerCluster,
  ): Observable<RockExplorerCluster> {
    return this.http
      .put(
        this.api.rockExplorer.updateCluster(cluster.id),
        RockExplorerCluster.serialize(cluster),
      )
      .pipe(map(RockExplorerCluster.deserialize));
  }

  public deleteCluster(cluster: RockExplorerCluster): Observable<null> {
    return this.http
      .delete(this.api.rockExplorer.deleteCluster(cluster.id))
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
