import {
  Component,
  Input,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBan, lucideCircleHelp } from '@ng-icons/lucide';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  ClosedSpotType,
  ClosureStateService,
} from '../../../../services/crud/closure-state.service';
import { ClosedSpotAlertComponent } from '../closed-spot-alert/closed-spot-alert.component';
import { ClosureReasonAlert } from '../../../../models/closure-reason-alert';

@Component({
  selector: 'lc-closed-spot-tag',
  imports: [
    NgIcon,
    HlmBadge,
    ...HlmPopoverImports,
    HlmSpinner,
    TranslocoDirective,
    ClosedSpotAlertComponent,
  ],
  providers: [provideIcons({ lucideBan, lucideCircleHelp })],
  templateUrl: './closed-spot-tag.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './closed-spot-tag.component.scss',
})
export class ClosedSpotTagComponent {
  @Input({ required: true }) spotType: ClosedSpotType;
  @Input({ required: true }) slug: string;
  /** When already loaded (e.g. detail view), skip the closure-state request. */
  @Input() reasons: ClosureReasonAlert[] | null = null;
  @Input() closureIsPermanent = true;

  protected loading = false;
  protected loadError = false;
  protected loadedReasons: ClosureReasonAlert[] | null = null;
  protected loadedClosureIsPermanent: boolean | null = null;

  private closureStateService = inject(ClosureStateService);
  private loadStarted = false;

  protected onTagClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  protected onPopoverState(state: string): void {
    if (state === 'open') {
      this.onPopoverShow();
    }
  }

  protected onPopoverShow(): void {
    if (
      this.hasPreloadedReasons() ||
      this.loadedReasons !== null ||
      this.loadStarted
    ) {
      return;
    }
    this.loadStarted = true;
    this.loading = true;
    this.loadError = false;
    this.closureStateService
      .getClosureState(this.spotType, this.slug)
      .subscribe({
        next: (state) => {
          this.loadedReasons = state.closedReasons;
          this.loadedClosureIsPermanent = state.closureIsPermanent;
          this.loading = false;
        },
        error: () => {
          this.loadError = true;
          this.loading = false;
        },
      });
  }

  protected get displayReasons(): ClosureReasonAlert[] | null {
    if (this.loadedReasons !== null) {
      return this.loadedReasons;
    }
    if (this.hasPreloadedReasons()) {
      return this.reasons;
    }
    return null;
  }

  private hasPreloadedReasons(): boolean {
    return this.reasons !== null && this.reasons !== undefined;
  }

  protected get isPermanentClosure(): boolean {
    if (this.loadedClosureIsPermanent !== null) {
      return this.loadedClosureIsPermanent;
    }
    return this.closureIsPermanent;
  }
}
