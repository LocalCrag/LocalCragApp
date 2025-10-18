import { Component, HostBinding, OnInit, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Store } from '@ngrx/store';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';

/**
 * Displays a message, requesting the user to check his mailbox for a password reset link.
 */
@Component({
  selector: 'lc-forgot-password-check-mailbox',
  templateUrl: './forgot-password-check-mailbox.component.html',
  styleUrls: ['./forgot-password-check-mailbox.component.scss'],
  imports: [TranslocoDirective],
})
export class ForgotPasswordCheckMailboxComponent implements OnInit {
  @HostBinding('class.auth-view') authView: boolean = true;

  private title = inject(Title);
  private store = inject(Store);
  private translocoService = inject(TranslocoService);

  ngOnInit() {
    this.store.select(selectInstanceName).subscribe((instanceName) => {
      this.title.setTitle(
        `${this.translocoService.translate(marker('forgotPasswordCheckMailboxBrowserTitle'))} - ${instanceName}`,
      );
    });
  }
}
