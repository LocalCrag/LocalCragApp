import { Component, Input, ViewChild, inject } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { Popover } from 'primeng/popover';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
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
    TagModule,
    Popover,
    ProgressSpinnerModule,
    TranslocoDirective,
    ClosedSpotAlertComponent,
  ],
  templateUrl: './closed-spot-tag.component.html',
  styleUrl: './closed-spot-tag.component.scss',
})
export class ClosedSpotTagComponent {
  @Input({ required: true }) spotType: ClosedSpotType;
  @Input({ required: true }) slug: string;
  /** When already loaded (e.g. detail view), skip the closure-state request. */
  @Input() reasons: ClosureReasonAlert[] | null = null;

  @ViewChild('popover') popover: Popover;

  protected loading = false;
  protected loadError = false;
  protected loadedReasons: ClosureReasonAlert[] | null = null;

  private closureStateService = inject(ClosureStateService);
  private loadStarted = false;

  protected onTagClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.popover.toggle(event);
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
}
