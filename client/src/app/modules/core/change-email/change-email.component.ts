import {
  Component,
  HostBinding,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HlmAlert } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { UsersService } from '../../../services/crud/users.service';
import { Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { newAuthCredentials } from '../../../ngrx/actions/auth.actions';

@Component({
  selector: 'lc-change-email',
  imports: [HlmAlert, HlmButton, HlmSpinner, RouterLink, TranslocoDirective],
  templateUrl: './change-email.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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
