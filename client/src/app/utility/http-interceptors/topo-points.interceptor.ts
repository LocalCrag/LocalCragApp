import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { selectIsModerator } from '../../ngrx/selectors/auth.selectors';
import { selectInstanceSettingsState } from '../../ngrx/selectors/instance-settings.selectors';
import { AppNotificationsService } from '../../services/core/app-notifications.service';

/**
 * Shows a toast when a moderator's save changed their topo points.
 * The toast stays hidden when the moderator game UI is off.
 */
@Injectable()
export class TopoPointsInterceptor implements HttpInterceptor {
  private store = inject(Store);
  private notifications = inject(AppNotificationsService);
  private settings = toSignal(this.store.select(selectInstanceSettingsState));
  private isModerator = toSignal(this.store.select(selectIsModerator));

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      tap((event) => {
        const settings = this.settings();
        if (
          !(event instanceof HttpResponse) ||
          !settings?.loaded ||
          !settings.moderatorGameEnabled ||
          !this.isModerator()
        ) {
          return;
        }
        const raw = event.headers.get('X-Topo-Points-Delta');
        const delta = raw ? Number(raw) : 0;
        if (!delta) {
          return;
        }
        this.notifications.toast(
          delta > 0 ? 'TOPO_POINTS_GAINED' : 'TOPO_POINTS_LOST',
          {},
          { points: Math.abs(delta) },
        );
      }),
    );
  }
}
