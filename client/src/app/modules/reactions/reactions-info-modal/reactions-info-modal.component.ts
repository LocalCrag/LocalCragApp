import { Component, inject } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Reactions } from '../../../models/reactions';

@Component({
  selector: 'lc-reactions-info-modal',
  imports: [],
  templateUrl: './reactions-info-modal.component.html',
  styleUrl: './reactions-info-modal.component.scss',
})
export class ReactionsInfoModalComponent {
  private config = inject(DynamicDialogConfig);

  public reactions: Reactions = this.config.data?.reactions ?? [];
}
