import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {CacheService} from '../core/cache.service';
import {HttpClient} from '@angular/common/http';
import {Area} from '../../models/area';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {ItemOrder} from '../../interfaces/item-order.interface';
import {deserializeGrade, Grade} from '../../utility/misc/grades';
import {InstanceSettings} from '../../models/instance-settings';

@Injectable({
  providedIn: 'root'
})
export class InstanceSettingsService {

  constructor(private api: ApiService,
              private cache: CacheService,
              private http: HttpClient) {
  }

  public getInstanceSettings(): Observable<InstanceSettings> {
    return this.cache.get(this.api.instanceSettings.getDetail(), map(InstanceSettings.deserialize));
  }

  public updateInstanceSettings(instanceSettings: InstanceSettings): Observable<InstanceSettings> {
    return this.http.put(this.api.instanceSettings.update(), InstanceSettings.serialize(instanceSettings)).pipe(
      tap(() => {
        this.cache.clear(this.api.instanceSettings.getDetail());
      }),
      map(InstanceSettings.deserialize)
    );
  }

}
