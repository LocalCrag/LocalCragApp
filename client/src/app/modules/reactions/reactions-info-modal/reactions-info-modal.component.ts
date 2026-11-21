import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { Reactions } from '../../../models/reactions';

type ReactionsInfoDialogContext = {
  reactions?: Reactions;
};

@Component({
  selector: 'lc-reactions-info-modal',
  imports: [TranslocoDirective],
  templateUrl: './reactions-info-modal.component.html',
  styleUrl: './reactions-info-modal.component.scss',
})
export class ReactionsInfoModalComponent {
  private context = injectBrnDialogContext<ReactionsInfoDialogContext>();

  public reactions: Reactions = this.context.reactions ?? [];
}
