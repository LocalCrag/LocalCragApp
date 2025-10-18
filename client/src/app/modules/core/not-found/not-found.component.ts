import { Component, HostBinding, OnInit, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { Store } from '@ngrx/store';
import { NavigationService } from '../../../services/core/navigation.service';

/**
 * A 404 error page.
 */
@Component({
  selector: 'lc-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
  imports: [TranslocoDirective],
})
export class NotFoundComponent implements OnInit {
  @HostBinding('class.auth-view') authView: boolean = true;

  public previousUrl: string;

  private title = inject(Title);
  private navigationService = inject(NavigationService);
  private store = inject(Store);
  private translocoService = inject(TranslocoService);

  ngOnInit() {
    this.previousUrl = this.navigationService.getPreviousUrl();
    this.store.select(selectInstanceName).subscribe((instanceName) => {
      this.title.setTitle(
        `${this.translocoService.translate(marker('notFoundPageBrowserTitle'))} - ${instanceName}`,
      );
    });
  }
}
