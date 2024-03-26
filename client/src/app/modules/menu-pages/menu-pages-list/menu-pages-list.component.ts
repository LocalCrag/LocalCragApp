import {Component, OnInit} from '@angular/core';
import {AsyncPipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {DataViewModule} from 'primeng/dataview';
import {DropdownModule} from 'primeng/dropdown';
import {RouterLink} from '@angular/router';
import {SelectItem} from 'primeng/api';
import {TranslocoDirective, TranslocoService} from '@ngneat/transloco';
import {Post} from '../../../models/post';
import {LoadingState} from '../../../enums/loading-state';
import {forkJoin, Observable} from 'rxjs';
import {PostsService} from '../../../services/crud/posts.service';
import {select, Store} from '@ngrx/store';
import {Title} from '@angular/platform-browser';
import {selectIsLoggedIn} from '../../../ngrx/selectors/auth.selectors';
import {selectIsMobile} from '../../../ngrx/selectors/device.selectors';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {environment} from '../../../../environments/environment';
import {MenuPage} from '../../../models/menu-page';
import {MenuPagesService} from '../../../services/crud/menu-pages.service';
import {SharedModule} from '../../shared/shared.module';
import {FormsModule} from '@angular/forms';
import {selectInstanceName} from '../../../ngrx/selectors/instance-settings.selectors';

@Component({
  selector: 'lc-menu-pages-list',
  standalone: true,
  imports: [
    AsyncPipe,
    ButtonModule,
    CardModule,
    DataViewModule,
    DropdownModule,
    NgForOf,
    NgIf,
    RouterLink,
    SharedModule,
    TranslocoDirective,
    FormsModule,
    NgClass
  ],
  templateUrl: './menu-pages-list.component.html',
  styleUrl: './menu-pages-list.component.scss'
})
export class MenuPagesListComponent implements OnInit {

  public menuPages: MenuPage[];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public sortOptions: SelectItem[];
  public sortKey: SelectItem;
  public sortOrder: number;
  public sortField: string;
  public isLoggedIn$: Observable<boolean>;
  public isMobile$: Observable<boolean>;

  constructor(public menuPagesService: MenuPagesService,
              private store: Store,
              private title: Title,
              private translocoService: TranslocoService) {
  }

  /**
   * Loads the menu pages on initialization.
   */
  ngOnInit() {
    this.refreshData();
    this.isLoggedIn$ = this.store.pipe(select(selectIsLoggedIn));
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.store.select(selectInstanceName).subscribe(instanceName => {
      this.title.setTitle(`${this.translocoService.translate(marker('menuPagesListBrowserTitle'))} - ${instanceName}`);
    });
  }

  /**
   * Loads new data.
   */
  refreshData() {
    forkJoin([
      this.menuPagesService.getMenuPages(),
      this.translocoService.load(`${environment.language}`)
    ]).subscribe(([menuPages, e]) => {
      this.menuPages = menuPages;
      this.loading = LoadingState.DEFAULT;
      this.sortOptions = [
        {label: this.translocoService.translate(marker('sortNewToOld')), value: 'timeCreated'},
        {label: this.translocoService.translate(marker('sortOldToNew')), value: '!timeCreated'},
      ];
      this.sortKey = this.sortOptions[0];
    });
  }

  /**
   * Sets the sort field and order.
   * @param event Sort change event.
   */
  onSortChange(event: any) {
    let value = event.value.value;
    if (value.indexOf('!') === 0) {
      this.sortOrder = 1;
      this.sortField = value.substring(1, value.length);
    } else {
      this.sortOrder = -1;
      this.sortField = value;
    }
  }

}
