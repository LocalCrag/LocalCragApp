import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { LoadingState } from '../../../enums/loading-state';
import { forkJoin, Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { PageTitleService } from '../../../services/core/page-title.service';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { MenuPage } from '../../../models/menu-page';
import { MenuPagesService } from '../../../services/crud/menu-pages.service';
import { FormsModule } from '@angular/forms';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { MenuPagesListSkeletonComponent } from '../menu-list-skeleton/menu-pages-list-skeleton.component';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideEye,
  lucideFilePen,
  lucideInfo,
  lucidePlus,
} from '@ng-icons/lucide';

interface SelectItem<T = any> {
  label?: string;
  value?: T;
  [key: string]: any;
}

@Component({
  providers: [
    provideIcons({ lucideEye, lucideFilePen, lucideInfo, lucidePlus }),
  ],
  selector: 'lc-menu-pages-list',
  imports: [
    RouterLink,
    TranslocoDirective,
    FormsModule,
    NgClass,
    MenuPagesListSkeletonComponent,
    HlmButton,
    HlmAlert,
    HlmAlertDescription,
    ...HlmSelectImports,
    NgIcon,
  ],
  templateUrl: './menu-pages-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './menu-pages-list.component.scss',
})
export class MenuPagesListComponent implements OnInit {
  public menuPages: MenuPage[];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public sortOptions: SelectItem[];
  public sortKey: SelectItem;
  public sortOrder: number;
  public sortField: string;
  public isMobile$: Observable<boolean>;
  public menuPagesService = inject(MenuPagesService);

  private store = inject(Store);
  private title = inject(Title);
  private translocoService = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);

  /**
   * Loads the menu pages on initialization.
   */
  ngOnInit() {
    this.pageTitleService.setTitle(
      this.translocoService.translate(
        marker('menuPages.menuPageList.menuPagesListTitle'),
      ),
    );
    this.refreshData();
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.store.select(selectInstanceName).subscribe((instanceName) => {
      this.title.setTitle(
        `${this.translocoService.translate(marker('menuPagesListBrowserTitle'))} - ${instanceName}`,
      );
    });
  }

  /**
   * Loads new data.
   */
  refreshData() {
    forkJoin([this.menuPagesService.getMenuPages()]).subscribe(
      ([menuPages]) => {
        this.menuPages = menuPages;
        this.loading = LoadingState.DEFAULT;
        this.sortOptions = [
          {
            label: this.translocoService.translate(marker('sortNewToOld')),
            value: 'timeCreated',
          },
          {
            label: this.translocoService.translate(marker('sortOldToNew')),
            value: '!timeCreated',
          },
        ];
        this.sortKey = this.sortOptions[0];
      },
    );
  }

  /**
   * Sets the sort field and order.
   * @param event Sort change event.
   */
  onSortChange(event: any) {
    const value = event.value.value;
    if (value.indexOf('!') === 0) {
      this.sortOrder = 1;
      this.sortField = value.substring(1, value.length);
    } else {
      this.sortOrder = -1;
      this.sortField = value;
    }
  }

  sortClientList<T>(items: T[] | null | undefined): T[] {
    if (!items || !this.sortField) {
      return items ?? [];
    }
    const direction = this.sortOrder ?? 1;
    return [...items].sort((a: any, b: any) => {
      const left = a?.[this.sortField];
      const right = b?.[this.sortField];
      if (left === right) {
        return 0;
      }
      if (left == null) {
        return 1;
      }
      if (right == null) {
        return -1;
      }
      return left > right ? direction : -direction;
    });
  }
}
