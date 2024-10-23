import { Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { InstanceSettings } from '../../models/instance-settings';

@Injectable({
  providedIn: 'root',
})
export class InstanceSettingsService {
  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

  public getInstanceSettings(): Observable<InstanceSettings> {
    return this.http
      .get(this.api.instanceSettings.getDetail())
      .pipe(map(InstanceSettings.deserialize));
  }

  public updateInstanceSettings(
    instanceSettings: InstanceSettings,
  ): Observable<InstanceSettings> {
    return this.http
      .put(
        this.api.instanceSettings.update(),
        InstanceSettings.serialize(instanceSettings),
      )
      .pipe(map(InstanceSettings.deserialize));
  }
}
