import {Component, HostBinding, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormDirective} from '../../shared/forms/form.directive';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Observable, Subscription} from 'rxjs';
import {LoadingState} from '../../../enums/loading-state';
import {ActivatedRoute, Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../ngrx/reducers';
import {AppNotificationsService} from '../../../services/core/app-notifications.service';
import {selectIsLoggedIn, selectResetPasswordLoadingState} from '../../../ngrx/selectors/auth.selectors';
import {take} from 'rxjs/operators';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';
import { resetPassword } from 'src/app/ngrx/actions/auth.actions';
import {passwordsValidator} from '../../../utility/validators/passwords.validator';
import {Title} from '@angular/platform-browser';
import {TranslocoService} from '@ngneat/transloco';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'lc-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit, OnDestroy{

  @HostBinding('class.auth-view') authView: boolean = true;

  @ViewChild(FormDirective) formDirective: FormDirective;

  public resetPasswordForm: FormGroup;
  public loadingState$: Observable<LoadingState>;
  public loadingStates = LoadingState;
  public resetPasswordPressed = false;
  public routeParamSubscription: Subscription;

  private resetPasswordHash: string;

  constructor(private route: ActivatedRoute,
              private store: Store<AppState>,
              private router: Router,
              private title: Title,
              private translocoService: TranslocoService,
              private fb: FormBuilder) {
  }

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    // Only logged-out users can use this: Redirect to home if logged in
    this.store.pipe(select(selectIsLoggedIn), take(1)).subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.router.navigate(['/']);
        this.store.dispatch(toastNotification(NotificationIdentifier.LOG_OUT_TO_USE_THIS_FUNCTION));
      }
    });
    this.buildForm();
    this.routeParamSubscription = this.route.params.pipe(take(1)).subscribe(params => {
      this.resetPasswordHash = params['hash'];
    });
    this.loadingState$ = this.store.pipe(select(selectResetPasswordLoadingState));
    this.title.setTitle(`${this.translocoService.translate(marker('resetPasswordBrowserTitle'))} - ${environment.instanceName}`)
  }

  /**
   * Unsubscribes from subscriptions on component destruction.
   */
  ngOnDestroy() {
    this.routeParamSubscription.unsubscribe();
  }

  /**
   * Reset the password
   */
  public resetPassword() {
    this.resetPasswordPressed = true;
    if (this.resetPasswordForm.valid) {
      this.store.dispatch(resetPassword({
        password: this.resetPasswordForm.get('newPasswords.password').value,
        resetPasswordHash: this.resetPasswordHash
      }));
    } else {
      this.formDirective.markAsTouched();
    }
  }

  /**
   * Check if the passwords don't match.
   *
   * @return Returns true if the passwords don't match.
   */
  public passwordsDontMatch(): boolean {
    if (this.resetPasswordForm.get('newPasswords.password').pristine ||
      this.resetPasswordForm.get('newPasswords.passwordConfirm').pristine) {
      return false;
    }
    return this.resetPasswordForm.get('newPasswords').errors && this.resetPasswordForm.get('newPasswords').errors['passwordsMatch'];
  }

  /**
   * Builds the reset password form.
   */
  private buildForm() {
    this.resetPasswordForm = this.fb.group({
      newPasswords: this.fb.group({
        password: ['', [Validators.required, Validators.minLength(8)]],
        passwordConfirm: ['', [Validators.required, Validators.minLength(8)]]
      }, {
        validators: passwordsValidator()
      })
    });
  }

}
