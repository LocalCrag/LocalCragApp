import {Component, HostBinding, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {TranslocoService} from '@jsverse/transloco';
import {marker} from '@jsverse/transloco-keys-manager/marker';
import {environment} from '../../../../environments/environment';
import {Store} from '@ngrx/store';
import {selectInstanceName} from '../../../ngrx/selectors/instance-settings.selectors';

/**
 * Displays a message, requesting the user to check his mailbox for a password reset link.
 */
@Component({
  selector: 'lc-forgot-password-check-mailbox',
  templateUrl: './forgot-password-check-mailbox.component.html',
  styleUrls: ['./forgot-password-check-mailbox.component.scss']
})
export class ForgotPasswordCheckMailboxComponent implements OnInit{

  @HostBinding('class.auth-view') authView: boolean = true;

  constructor(private title: Title,
              private store: Store,
              private translocoService: TranslocoService) {
  }

  ngOnInit() {
    this.store.select(selectInstanceName).subscribe(instanceName => {
      this.title.setTitle(`${this.translocoService.translate(marker('forgotPasswordCheckMailboxBrowserTitle'))} - ${instanceName}`)
    });
  }

}
