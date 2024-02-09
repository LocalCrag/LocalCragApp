import {Component, HostBinding, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {TranslocoService} from '@ngneat/transloco';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {environment} from '../../../../environments/environment';

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
              private translocoService: TranslocoService) {
  }

  ngOnInit() {
    this.title.setTitle(`${this.translocoService.translate(marker('forgotPasswordCheckMailboxBrowserTitle'))} - ${environment.instanceName}`)
  }

}
