import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {MapMarkerProperties} from '../../models/map-marker';
import {FeatureCollection, Point} from 'geojson';

@Injectable({
  providedIn: 'root',
})
export class MapsService {
  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

  public getMarkersGeoJSON(
    filters: string = '',
  ): Observable<FeatureCollection<Point, MapMarkerProperties>> {
    return this.http.get(this.api.maps.getMarkers(filters)) as Observable<
      FeatureCollection<Point, MapMarkerProperties>
    >;
  }
}
