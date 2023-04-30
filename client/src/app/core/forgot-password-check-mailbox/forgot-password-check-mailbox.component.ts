import {Component, HostBinding} from '@angular/core';

/**
 * Displays a message, requesting the user to check his mailbox for a password reset link.
 */
@Component({
  selector: 'lc-forgot-password-check-mailbox',
  templateUrl: './forgot-password-check-mailbox.component.html',
  styleUrls: ['./forgot-password-check-mailbox.component.scss']
})
export class ForgotPasswordCheckMailboxComponent {

  @HostBinding('class.auth-view') authView: boolean = true;

}
