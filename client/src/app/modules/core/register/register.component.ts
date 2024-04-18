import {Component, HostBinding, OnInit, ViewChild} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {PasswordModule} from 'primeng/password';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {SharedModule} from '../../shared/shared.module';
import {TranslocoDirective, TranslocoService} from '@ngneat/transloco';
import {Router, RouterLink} from '@angular/router';
import {FormDirective} from '../../shared/forms/form.directive';
import {LoadingState} from '../../../enums/loading-state';
import {Store} from '@ngrx/store';
import {AppState} from '../../../ngrx/reducers';
import {Crag} from '../../../models/crag';
import {User} from '../../../models/user';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';
import {UsersService} from '../../../services/crud/users.service';
import {selectInstanceName} from '../../../ngrx/selectors/instance-settings.selectors';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {Title} from '@angular/platform-browser';
import {emailRegex} from '../../../utility/regex/email-regex';
import {UserValidatorsService} from '../../../services/core/user-validators.service';

@Component({
  selector: 'lc-register',
  standalone: true,
  imports: [
    AsyncPipe,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ReactiveFormsModule,
    SharedModule,
    TranslocoDirective,
    RouterLink
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {

  @HostBinding('class.auth-view') authView: boolean = true;

  @ViewChild(FormDirective) formDirective: FormDirective;

  public registrationForm: FormGroup;
  public loadingStates = LoadingState;
  public loadingState: LoadingState = LoadingState.DEFAULT;

  constructor(private router: Router,
              private usersService: UsersService,
              private store: Store<AppState>,
              private title: Title,
              private userValidators: UserValidatorsService,
              private translocoService: TranslocoService,
              private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.buildForm();
    this.store.select(selectInstanceName).subscribe(instanceName => {
      this.title.setTitle(`${this.translocoService.translate(marker('registerFormTabTitle'))} - ${instanceName}`)
    });
  }

  public register() {
    if (this.registrationForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const user = new User();
      user.firstname = this.registrationForm.get('firstname').value;
      user.lastname = this.registrationForm.get('lastname').value;
      user.email = (this.registrationForm.get('email').value as string).toLowerCase();
      this.usersService.registerUser(user).subscribe(() => {
        this.store.dispatch(toastNotification(NotificationIdentifier.USER_REGISTERED));
        this.router.navigate(['/register-check-mailbox']);
        this.loadingState = LoadingState.DEFAULT;
      });
    } else {
      this.formDirective.markAsTouched();
    }
  }

  private buildForm() {
    this.registrationForm = this.fb.group({
      firstname: [null, [Validators.required, Validators.maxLength(120)]],
      lastname: [null, [Validators.required, Validators.maxLength(120)]],
      email: [null, {
        validators: [Validators.required, Validators.pattern(emailRegex), Validators.maxLength(120)],
        asyncValidators: [this.userValidators.emailValidator([])],
        updateOn: 'blur'
      }]
    });
  }

}

