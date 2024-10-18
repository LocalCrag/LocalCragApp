import { Component, HostBinding } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Title } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';

@Component({
  selector: 'lc-register-check-mailbox',
  standalone: true,
  imports: [TranslocoDirective],
  templateUrl: './register-check-mailbox.component.html',
  styleUrl: './register-check-mailbox.component.scss',
})
export class RegisterCheckMailboxComponent {
  @HostBinding('class.auth-view') authView: boolean = true;

  constructor(
    private title: Title,
    private store: Store,
    private translocoService: TranslocoService,
  ) {}

  ngOnInit() {
    this.store.select(selectInstanceName).subscribe((instanceName) => {
      this.title.setTitle(
        `${this.translocoService.translate(marker('registerCheckMailboxBrowserTitle'))} - ${instanceName}`,
      );
    });
  }
}
