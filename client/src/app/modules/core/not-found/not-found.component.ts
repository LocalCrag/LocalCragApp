import { Component, HostBinding, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { Store } from '@ngrx/store';

/**
 * A 404 error page.
 */
@Component({
  selector: 'lc-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
})
export class NotFoundComponent implements OnInit {
  @HostBinding('class.auth-view') authView: boolean = true;

  public url: string;

  constructor(
    private title: Title,
    private store: Store,
    private translocoService: TranslocoService,
  ) {}

  ngOnInit() {
    this.url = window.location.href;
    this.store.select(selectInstanceName).subscribe((instanceName) => {
      this.title.setTitle(
        `${this.translocoService.translate(marker('notFoundPageBrowserTitle'))} - ${instanceName}`,
      );
    });
  }
}
