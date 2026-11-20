import {
  Component,
  HostListener,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { liveQuery } from 'dexie';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircle, lucideX } from '@ng-icons/lucide';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { TranslocoDirective } from '@jsverse/transloco';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { RockExplorerUiService } from '../rock-explorer-ui.service';
import { rockExplorerDraftDb } from '../offline/rock-explorer-draft.db';
import type { RockExplorerDraftRecord } from '../offline/rock-explorer-draft.types';

@Component({
  selector: 'lc-rock-explorer-sessions',
  imports: [HlmBadge, HlmButton, NgIcon, TranslocoDirective, TimeAgoPipe],
  providers: [provideIcons({ lucideCircle, lucideX })],
  templateUrl: './rock-explorer-sessions.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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
