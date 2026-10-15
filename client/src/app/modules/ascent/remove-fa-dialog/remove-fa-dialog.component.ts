import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Textarea } from 'primeng/textarea';
import { reloadAfterAscent } from '../../../ngrx/actions/ascent.actions';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { Ascent } from '../../../models/ascent';
import { AscentsService } from '../../../services/crud/ascents.service';

export const FA_REMOVAL_MESSAGE_MAX_LENGTH = 2000;

@Component({
  selector: 'lc-remove-fa-dialog',
  imports: [FormsModule, TranslocoDirective, ButtonModule, Textarea],
  templateUrl: './remove-fa-dialog.component.html',
  styleUrl: './remove-fa-dialog.component.scss',
})
export class RemoveFaDialogComponent {
  public message = '';
  public saving = false;
  public readonly maxLength = FA_REMOVAL_MESSAGE_MAX_LENGTH;

  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);
  private ascentsService = inject(AscentsService);
  private store = inject(Store);

  private readonly ascent: Ascent = this.config.data.ascent;

  public cancel(): void {
    this.ref.close();
  }

  public confirm(): void {
    if (this.saving) {
      return;
    }
    const message = this.message.trim();
    this.saving = true;
    this.ascentsService
      .clearAscentFa(this.ascent.id, message || null)
      .subscribe({
        next: () => {
          this.store.dispatch(toastNotification('ASCENT_FA_REMOVED'));
          if (this.ascent.line?.id) {
            this.store.dispatch(
              reloadAfterAscent({ ascendedLineId: this.ascent.line.id }),
            );
          }
          this.ref.close();
        },
        error: () => {
          this.saving = false;
        },
      });
  }
}
