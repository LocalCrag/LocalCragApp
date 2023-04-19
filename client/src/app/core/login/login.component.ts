import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';

/**
 * Component that shows a login form.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  public loginForm: FormGroup;

  constructor(private store: Store<AppState>,
              private router: Router,
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
