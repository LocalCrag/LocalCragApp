import { Component, HostListener, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { liveQuery } from 'dexie';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { TranslocoDirective } from '@jsverse/transloco';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { RockExplorerUiService } from '../rock-explorer-ui.service';
import { rockExplorerDraftDb } from '../offline/rock-explorer-draft.db';
import type { RockExplorerDraftRecord } from '../offline/rock-explorer-draft.types';

@Component({
  selector: 'lc-rock-explorer-sessions',
  imports: [Button, Tag, TranslocoDirective, TimeAgoPipe],
  templateUrl: './rock-explorer-sessions.component.html',
  styleUrl: './rock-explorer-sessions.component.scss',
})
export class RockExplorerSessionsComponent {
  readonly ui = inject(RockExplorerUiService);

  readonly drafts = toSignal(
    from(
      liveQuery(() =>
        rockExplorerDraftDb.drafts.orderBy('updatedAt').reverse().toArray(),
      ),
    ),
    { initialValue: [] as RockExplorerDraftRecord[] },
  );

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.ui.sessionsPanelOpen()) {
      this.ui.dispatch({ type: 'closeSessionsPanel' });
    }
  }
}
