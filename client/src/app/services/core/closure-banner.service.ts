import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, RoutesRecognized, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ClosureReasonAlert } from '../../models/closure-reason-alert';
import { getPrimaryPageHostKey } from '../../utility/router/primary-page-host-key';

/**
 * Closure reasons for the banner under the page title.
 * Detail pages set the current spot's reasons. The list clears when the
 * page host changes, so a tab switch keeps the banner and leaving the spot
 * does not.
 */
@Injectable({
  providedIn: 'root',
})
export class ClosureBannerService {
  private readonly reasonsSubject = new BehaviorSubject<ClosureReasonAlert[]>(
    [],
  );

  readonly reasons$ = this.reasonsSubject.asObservable();

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private currentPageHostKey = '';

  constructor() {
    this.currentPageHostKey = getPrimaryPageHostKey(
      this.router.routerState.snapshot.root,
    );

    this.router.events
      .pipe(
        filter((event) => event instanceof RoutesRecognized),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        const nextPageHostKey = getPrimaryPageHostKey(
          (event as RoutesRecognized).state.root,
        );
        if (nextPageHostKey !== this.currentPageHostKey) {
          this.reasonsSubject.next([]);
        }
      });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentPageHostKey = getPrimaryPageHostKey(
          this.router.routerState.snapshot.root,
        );
      });
  }

  setReasons(reasons: ClosureReasonAlert[] | null | undefined): void {
    this.reasonsSubject.next(reasons ?? []);
  }
}
