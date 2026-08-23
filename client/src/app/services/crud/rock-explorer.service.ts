import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FeatureCollection, Geometry } from 'geojson';
import { ApiService } from '../core/api.service';
import { RockExplorerFeature } from '../../models/rock-explorer-feature';
import { User } from '../../models/user';

export interface RockExplorerFeatureFilters {
  potential?: string;
  rockQuality?: string;
  rockType?: string;
  createdById?: string;
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

  /** Owner-only draft list (GET /features?status=draft). */
  public listDrafts(): Observable<RockExplorerFeature[]> {
    const params = new HttpParams().set('status', 'draft');
    return this.http
      .get<any[]>(this.api.rockExplorer.getFeatures(), { params })
      .pipe(map((rows) => (rows ?? []).map(RockExplorerFeature.deserialize)));
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

  /**
   * Draft → published PUT. Device lock via body recordingDeviceId
   * (apply clears recording columns for published).
   */
  public publishFeature(
    feature: RockExplorerFeature,
    recordingDeviceId: string,
  ): Observable<RockExplorerFeature> {
    const deviceId = (recordingDeviceId ?? '').trim();
    feature.status = 'published';
    feature.recordingDeviceId = null;
    const body = RockExplorerFeature.serialize(feature) as Record<
      string,
      unknown
    >;
    // serialize() nulls recordingDeviceId for published — restore for lock check
    body['recordingDeviceId'] = deviceId || null;
    return this.http
      .put(this.api.rockExplorer.updateFeature(feature.id), body)
      .pipe(map(RockExplorerFeature.deserialize));
  }

  public cloneFeature(
    featureId: string,
    recordingDeviceId: string,
  ): Observable<RockExplorerFeature> {
    return this.http
      .post(this.api.rockExplorer.cloneFeature(featureId), {
        recordingDeviceId,
      })
      .pipe(map(RockExplorerFeature.deserialize));
  }

  /** Typeahead: users who created published Rock Explorer features. */
  public searchCreators(query: string): Observable<User[]> {
    const params = new HttpParams().set('q', query);
    return this.http
      .get<any[]>(this.api.rockExplorer.searchCreators(), { params })
      .pipe(map((rows) => (rows ?? []).map(User.deserialize)));
  }

  public deleteFeature(feature: RockExplorerFeature): Observable<null> {
    let params = new HttpParams();
    if (feature.status === 'draft' && feature.recordingDeviceId) {
      params = params.set('recordingDeviceId', feature.recordingDeviceId);
    }
    return this.http
      .delete(this.api.rockExplorer.deleteFeature(feature.id), { params })
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
