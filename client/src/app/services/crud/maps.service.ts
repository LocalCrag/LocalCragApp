import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MapMarkerProperties } from '../../models/map-marker';
import { FeatureCollection, Point } from 'geojson';
import {
  ApiQueryParams,
  httpGetOptions,
} from '../../utility/http/query-params';

@Injectable({
  providedIn: 'root',
})
export class MapsService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  public getMarkersGeoJSON(
    params: ApiQueryParams = {},
  ): Observable<FeatureCollection<Point, MapMarkerProperties>> {
    return this.http.get(
      this.api.maps.getMarkers(),
      httpGetOptions(params),
    ) as Observable<FeatureCollection<Point, MapMarkerProperties>>;
  }
}
