import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

export interface FaRemovalMessageDialogData {
  message: string;
  ascentLink: string | null;
  unavailable?: boolean;
}

@Component({
  selector: 'lc-fa-removal-message-dialog',
  imports: [ButtonModule, TranslocoDirective],
  templateUrl: './fa-removal-message-dialog.component.html',
  styleUrl: './fa-removal-message-dialog.component.scss',
})
export class FaRemovalMessageDialogComponent {
  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);
  private router = inject(Router);

  public readonly message: string = this.config.data?.message ?? '';
  public readonly ascentLink: string | null =
    this.config.data?.ascentLink ?? null;

  public close(): void {
    this.ref.close();
  }

  public viewAscent(): void {
    const link = this.ascentLink;
    this.ref.close();
    if (link) {
      void this.router.navigateByUrl(link);
    }
  }
}
