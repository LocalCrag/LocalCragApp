import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { isLocalStorageAccessDenied } from '../../../utility/local-storage';

/**
 * Persistent banner when the browser denies localStorage.
 *
 * Rendered by TopAlertsComponent, which places it above the site header.
 *
 * Login, language, theme, and filters all depend on localStorage. A blocked
 * document throws SecurityError on the property read itself, so the app cannot
 * keep a session or preferences until the user allows site data and reloads.
 */
@Component({
  selector: 'lc-storage-access-alert',
  templateUrl: './storage-access-alert.component.html',
  styleUrls: ['./storage-access-alert.component.scss'],
  imports: [TranslocoDirective],
})
export class StorageAccessAlertComponent {
  /** Fixed for this document; the user must change browser settings and reload. */
  readonly accessDenied = isLocalStorageAccessDenied();
}
