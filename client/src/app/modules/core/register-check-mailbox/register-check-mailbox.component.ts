import {
  Component,
  HostBinding,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Title } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';

@Component({
  selector: 'lc-register-check-mailbox',
  imports: [TranslocoDirective],
  templateUrl: './register-check-mailbox.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './register-check-mailbox.component.scss',
})
export class RegisterCheckMailboxComponent implements OnInit {
  @HostBinding('class.auth-view') authView: boolean = true;

  private title = inject(Title);
  private store = inject(Store);
  private translocoService = inject(TranslocoService);

  ngOnInit() {
    this.store.select(selectInstanceName).subscribe((instanceName) => {
      this.title.setTitle(
        `${this.translocoService.translate(marker('registerCheckMailboxBrowserTitle'))} - ${instanceName}`,
      );
    });
  }
}
