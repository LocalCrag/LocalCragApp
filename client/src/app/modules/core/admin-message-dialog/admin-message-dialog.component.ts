import { Component, inject } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { TranslocoDirective } from '@jsverse/transloco';

export interface AdminMessageDialogData {
  title: string;
  text: string;
}

@Component({
  selector: 'lc-admin-message-dialog',
  imports: [ButtonModule, TranslocoDirective],
  templateUrl: './admin-message-dialog.component.html',
  styleUrl: './admin-message-dialog.component.scss',
})
export class AdminMessageDialogComponent {
  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);

  public readonly title: string = this.config.data?.title ?? '';
  public readonly text: string = this.config.data?.text ?? '';

  public close(): void {
    this.ref.close();
  }
}
