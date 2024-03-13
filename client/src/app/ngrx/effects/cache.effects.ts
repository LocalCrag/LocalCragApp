import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {map, tap} from 'rxjs/operators';
import {checkIsMobile, setIsMobile} from '../actions/device.actions';
import {clearGradeCache} from '../actions/cache.actions';
import {CacheService} from '../../services/core/cache.service';
import {ApiService} from '../../services/core/api.service';

/**
 * Effects for cache actions.
 */
@Injectable()
export class CacheEffects {

  /**
   * Checks if the device is a mobile devices and notifies the app about it.
   */
  onClearGradeCache = createEffect(() => this.actions$.pipe(
    ofType(clearGradeCache),
    tap(props => {
      if(props.area) {
        this.cache.clear(this.api.areas.getGrades(props.area));
      }
      if(props.sector) {
        this.cache.clear(this.api.sectors.getGrades(props.sector));
      }
      this.cache.clear(this.api.crags.getGrades(props.crag));
    })
  ),{dispatch: false});

  constructor(private api: ApiService,
              private cache: CacheService,
              private actions$: Actions) {
  }

}
