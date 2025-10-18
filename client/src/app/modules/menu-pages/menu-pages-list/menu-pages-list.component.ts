import { Component, OnInit, inject } from '@angular/core';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DataViewModule } from 'primeng/dataview';
import { RouterLink } from '@angular/router';
import { SelectItem } from 'primeng/api';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { LoadingState } from '../../../enums/loading-state';
import { forkJoin, Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { environment } from '../../../../environments/environment';
import { MenuPage } from '../../../models/menu-page';
import { MenuPagesService } from '../../../services/crud/menu-pages.service';
import { FormsModule } from '@angular/forms';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { Select } from 'primeng/select';
import { MenuPagesListSkeletonComponent } from '../menu-list-skeleton/menu-pages-list-skeleton.component';
import { Message } from 'primeng/message';

@Component({
  selector: 'lc-menu-pages-list',
  imports: [
    ButtonModule,
    CardModule,
    DataViewModule,
    NgForOf,
    RouterLink,
    TranslocoDirective,
    FormsModule,
    NgClass,
    Select,
    NgIf,
    MenuPagesListSkeletonComponent,
    Message,
  ],
  templateUrl: './menu-pages-list.component.html',
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

  /**
   * Loads the menu pages on initialization.
   */
  ngOnInit() {
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
    forkJoin([
      this.menuPagesService.getMenuPages(),
      this.translocoService.load(`${environment.language}`),
    ]).subscribe(([menuPages]) => {
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
    });
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
}
