import {Component, HostBinding, OnInit} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {MessageModule} from 'primeng/message';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {NgIf} from '@angular/common';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {UsersService} from '../../../services/crud/users.service';
import {Store} from '@ngrx/store';
import {Title} from '@angular/platform-browser';
import {TranslocoDirective, TranslocoService} from '@jsverse/transloco';
import {selectInstanceName} from '../../../ngrx/selectors/instance-settings.selectors';
import {marker} from '@jsverse/transloco-keys-manager/marker';
import {newAuthCredentials,} from '../../../ngrx/actions/auth.actions';

@Component({
  selector: 'lc-change-email',
  standalone: true,
  imports: [
    ButtonModule,
    MessageModule,
    RouterLink,
    NgIf,
    ProgressSpinnerModule,
    TranslocoDirective,
  ],
  templateUrl: './change-email.component.html',
  styleUrl: './change-email.component.scss',
})
export class ChangeEmailComponent implements OnInit {
  @HostBinding('class.auth-view') authView: boolean = true;

  public loading = true;
  public error = false;

  constructor(
    private usersService: UsersService,
    private route: ActivatedRoute,
    private store: Store,
    private translocoService: TranslocoService,
    private title: Title,
  ) {}

  ngOnInit(): void {
    this.store.select(selectInstanceName).subscribe((instanceName) => {
      this.title.setTitle(
        `${this.translocoService.translate(marker('changeEmailTabTitle'))} - ${instanceName}`,
      );
    });
    const newEmailHash = this.route.snapshot.params['hash'];
    this.usersService.changeEmail(newEmailHash).subscribe({
      next: (loginResponse) => {
        this.store.dispatch(
          newAuthCredentials({
            loginResponse: loginResponse,
            fromAutoLogin: false,
            initialCredentials: false,
          }),
        );
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }
}
