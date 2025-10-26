import { Component, HostBinding, OnInit, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { UsersService } from '../../../services/crud/users.service';
import { Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { newAuthCredentials } from '../../../ngrx/actions/auth.actions';

@Component({
  selector: 'lc-change-email',
  imports: [
    ButtonModule,
    MessageModule,
    RouterLink,
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

  private usersService = inject(UsersService);
  private route = inject(ActivatedRoute);
  private store = inject(Store);
  private translocoService = inject(TranslocoService);
  private title = inject(Title);

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
