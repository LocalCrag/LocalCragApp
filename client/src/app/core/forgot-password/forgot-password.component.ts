import {Component, HostBinding, OnInit, ViewChild} from '@angular/core';
import {FormDirective} from '../../shared/forms/form.directive';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Observable} from 'rxjs';
import {AuthCrudService} from '../../services/crud/auth-crud.service';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../ngrx/reducers';
import {AppNotificationsService} from '../../services/core/app-notifications.service';
import {LoadingState} from '../../enums/loading-state';
import {selectForgotPasswordLoadingState} from '../../ngrx/selectors/auth.selectors';
import {forgotPassword} from '../../ngrx/actions/auth.actions';
import {Router} from '@angular/router';

/**
 * A component that shows a form for requesting a reset password link per mail.
 */
@Component({
  selector: 'lc-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit{

  @HostBinding('class.auth-view') authView: boolean = true;

  @ViewChild(FormDirective, {static: true}) formDirective: FormDirective;

  public forgotPasswordForm: FormGroup;
  public loadingState$: Observable<LoadingState>;
  public loadingStates = LoadingState;

  constructor(private authCrud: AuthCrudService,
              private store: Store<AppState>,
              private notifications: AppNotificationsService,
              private fb: FormBuilder) {
  }

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.buildForm();
    this.loadingState$ = this.store.pipe(select(selectForgotPasswordLoadingState));
  }

  /**
   * Requests a reset password mail.
   */
  public requestResetPasswordMail() {
    if (this.forgotPasswordForm.valid) {
      this.store.dispatch(forgotPassword({
        email: this.forgotPasswordForm.get('email').value
      }));
    } else {
      this.formDirective.markAsTouched();
    }
  }

  /**
   * Builds the reset password form.
   */
  private buildForm() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required]]
    });
  }


}
