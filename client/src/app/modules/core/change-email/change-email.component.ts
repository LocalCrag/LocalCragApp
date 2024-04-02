import {Component, HostBinding, OnInit, ViewChild} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {MessageModule} from 'primeng/message';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {NgIf} from '@angular/common';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {FormDirective} from '../../shared/forms/form.directive';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {LoadingState} from '../../../enums/loading-state';
import {UsersService} from '../../../services/crud/users.service';
import {Store} from '@ngrx/store';
import {AppState} from '../../../ngrx/reducers';
import {Title} from '@angular/platform-browser';
import {UserValidatorsService} from '../../../services/core/user-validators.service';
import {TranslocoDirective, TranslocoService} from '@ngneat/transloco';
import {selectInstanceName} from '../../../ngrx/selectors/instance-settings.selectors';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {User} from '../../../models/user';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';
import {emailRegex} from '../../../utility/regex/email-regex';
import {newAuthCredentials, updateAccountSettings} from '../../../ngrx/actions/auth.actions';

@Component({
  selector: 'lc-change-email',
  standalone: true,
  imports: [
    ButtonModule,
    MessageModule,
    RouterLink,
    NgIf,
    ProgressSpinnerModule,
    TranslocoDirective
  ],
  templateUrl: './change-email.component.html',
  styleUrl: './change-email.component.scss'
})
export class ChangeEmailComponent implements OnInit {

  @HostBinding('class.auth-view') authView: boolean = true;

  public loading = true;
  public error = false;

  constructor(private usersService: UsersService,
              private route: ActivatedRoute,
              private store: Store,
              private translocoService: TranslocoService,
              private title: Title) {
  }

  ngOnInit(): void {
    this.store.select(selectInstanceName).subscribe(instanceName => {
      this.title.setTitle(`${this.translocoService.translate(marker('changeEmailTabTitle'))} - ${instanceName}`)
    });
    const newEmailHash = this.route.snapshot.params['hash'];
    this.usersService.changeEmail(newEmailHash).subscribe({
      next: loginResponse => {
        this.store.dispatch(newAuthCredentials({loginResponse: loginResponse, fromAutoLogin: false, initialCredentials: false}));
        this.loading = false;
      },
      error: ()=>{
        this.loading = false;
        this.error = true;
      }
    })
  }

}
