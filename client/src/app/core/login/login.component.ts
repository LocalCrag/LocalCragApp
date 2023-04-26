import {Component, HostBinding, OnInit, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {login} from 'src/app/ngrx/actions/auth.actions';
import {AppState} from '../../ngrx/reducers';


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

  public loginForm: FormGroup;

  constructor(private router: Router,
              private store: Store<AppState>,
              private fb: FormBuilder) {
  }

  ngOnInit(): void {
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
      console.log(42);
      // this.clrForm.markAsDirty(); TODO
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
