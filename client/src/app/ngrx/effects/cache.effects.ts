import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {map, tap} from 'rxjs/operators';
import {checkIsMobile, setIsMobile} from '../actions/device.actions';
import {clearAscentCache, clearGradeCache} from '../actions/cache.actions';
import {CacheService} from '../../services/core/cache.service';
import {ApiService} from '../../services/core/api.service';

/**
 * Effects for cache actions.
 */
@Injectable()
export class CacheEffects {

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

  onClearAscentCache = createEffect(() => this.actions$.pipe(
    ofType(clearAscentCache),
    tap(props => {
      this.cache.clearIfPathIncludes('ascents');
      this.cache.clear(this.api.crags.getList());
      this.cache.clear(this.api.sectors.getList(props.crag));
      this.cache.clear(this.api.areas.getList(props.sector));
      this.cache.clear(this.api.lines.getList(props.area));
      this.cache.clear(this.api.crags.getDetail(props.crag));
      this.cache.clear(this.api.sectors.getDetail(props.sector));
      this.cache.clear(this.api.areas.getDetail(props.area));
      this.cache.clear(this.api.lines.getDetail(props.line));
    })
  ),{dispatch: false});

  constructor(private api: ApiService,
              private cache: CacheService,
              private actions$: Actions) {
  }

}
