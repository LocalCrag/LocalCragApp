import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  InstanceSettings,
  type InstanceSettingsPatch,
} from '../../models/instance-settings';

@Injectable({
  providedIn: 'root',
})
export class InstanceSettingsService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  public getInstanceSettings(): Observable<InstanceSettings> {
    return this.http
      .get(this.api.instanceSettings.getDetail())
      .pipe(map(InstanceSettings.deserialize));
  }

  public patchInstanceSettings(
    patch: InstanceSettingsPatch,
  ): Observable<InstanceSettings> {
    return this.http
      .patch(this.api.instanceSettings.update(), patch)
      .pipe(map(InstanceSettings.deserialize));
  }
}
