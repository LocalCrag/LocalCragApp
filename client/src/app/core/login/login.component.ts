import {Component, HostBinding, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {login} from 'src/app/ngrx/actions/auth.actions';
import {AppState} from '../../ngrx/reducers';
import {LoadingState} from '../../enums/loading-state';
import {Observable} from 'rxjs';
import {selectLoginLoadingState} from '../../ngrx/selectors/auth.selectors';
import {FormDirective} from '../../shared/forms/form.directive';


/**
 * Component that shows a login form.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {

  @HostBinding('class.auth-view') authView: boolean = true;

  @ViewChild(FormDirective, {static: true}) formDirective: FormDirective;

  public loginForm: FormGroup;
  public loadingStates = LoadingState;
  public loadingState$: Observable<LoadingState>;

  constructor(private router: Router,
              private store: Store<AppState>,
              private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.loadingState$ = this.store.pipe(select(selectLoginLoadingState));
    this.buildForm();
  }

  /**
   * Logs in a user.
   */
  public login() {
    if (this.loginForm.valid) {
      this.store.dispatch(login({
        email: this.loginForm.get('email').value,
        password: this.loginForm.get('password').value,
      }));
    } else {
      this.formDirective.markAsTouched();
    }
  }

  /**
   * Builds the login form.
   */
  private buildForm() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

}
