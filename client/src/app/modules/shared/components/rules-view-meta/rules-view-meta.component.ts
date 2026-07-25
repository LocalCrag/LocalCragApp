import { Component, DestroyRef, Input, OnChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoDirective } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RulesAlertService } from '../../../../services/core/rules-alert.service';
import {
  RulesEntityType,
  RulesReadStatusService,
} from '../../../../services/crud/rules-read-status.service';
import { isRulesUpdatedSinceLastView } from '../../../../services/crud/rules-read-status.util';
import { DatePipe } from '../../pipes/date.pipe';

/**
 * Meta header for rules tabs: shows last-updated date, an "updated since last
 * view" notice when the visitor previously acknowledged an older version, and
 * marks the current version as read.
 */
@Component({
  selector: 'lc-rules-view-meta',
  templateUrl: './rules-view-meta.component.html',
  styleUrl: './rules-view-meta.component.scss',
  imports: [TranslocoDirective, DatePipe],
})
export class RulesViewMetaComponent implements OnChanges {
  @Input({ required: true }) entityType: RulesEntityType;
  @Input({ required: true }) entityId: string;
  @Input() rulesUpdatedAt: Date | null = null;

  public updatedSinceLastView = false;
  public ready = false;

  private rulesReadStatusService = inject(RulesReadStatusService);
  private rulesAlertService = inject(RulesAlertService);
  private destroyRef = inject(DestroyRef);
  private readonly load$ = new Subject<void>();

  constructor() {
    this.load$
      .pipe(
        switchMap(() =>
          this.rulesReadStatusService.getStatus(this.entityType, this.entityId),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((status) => {
        this.updatedSinceLastView = isRulesUpdatedSinceLastView(
          status?.acknowledgedUpdatedAt,
          this.rulesUpdatedAt,
        );
        this.ready = true;
        this.rulesAlertService.markEntityRead(
          this.entityType,
          this.entityId,
          this.rulesUpdatedAt,
        );
      });
  }

  ngOnChanges(): void {
    if (!this.entityId || !this.entityType) {
      return;
    }
    this.ready = false;
    this.load$.next();
  }
}
