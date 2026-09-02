import { Component, OnInit, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { RouterLink } from '@angular/router';
import { SelectItem } from 'primeng/api';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { LoadingState } from '../../../enums/loading-state';
import { forkJoin } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { PageTitleService } from '../../../services/core/page-title.service';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { AppAlert } from '../../../models/app-alert';
import { AppAlertsService } from '../../../services/crud/app-alerts.service';
import { FormsModule } from '@angular/forms';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { Select } from 'primeng/select';
import { Message } from 'primeng/message';
import { Tag } from 'primeng/tag';
import { Observable } from 'rxjs';

@Component({
  selector: 'lc-app-alerts-list',
  imports: [
    ButtonModule,
    DataViewModule,
    RouterLink,
    TranslocoDirective,
    FormsModule,
    NgClass,
    Select,
    Message,
    Tag,
  ],
  templateUrl: './app-alerts-list.component.html',
  styleUrl: './app-alerts-list.component.scss',
})
export class AppAlertsListComponent implements OnInit {
  public alerts: AppAlert[];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public sortOptions: SelectItem[];
  public sortKey: SelectItem;
  public sortOrder: number;
  public sortField: string;
  public isMobile$: Observable<boolean>;
  public appAlertsService = inject(AppAlertsService);

  private store = inject(Store);
  private title = inject(Title);
  private translocoService = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);

  ngOnInit() {
    this.pageTitleService.setTitle(
      this.translocoService.translate(
        marker('appAlerts.appAlertList.appAlertsListTitle'),
      ),
    );
    this.refreshData();
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.store.select(selectInstanceName).subscribe((instanceName) => {
      this.title.setTitle(
        `${this.translocoService.translate(marker('appAlertsListBrowserTitle'))} - ${instanceName}`,
      );
    });
  }

  refreshData() {
    forkJoin([this.appAlertsService.getAllAlerts()]).subscribe(([alerts]) => {
      this.alerts = alerts;
      this.loading = LoadingState.DEFAULT;
      this.sortOptions = [
        {
          label: this.translocoService.translate(marker('sortNewToOld')),
          value: 'startsAt',
        },
        {
          label: this.translocoService.translate(marker('sortOldToNew')),
          value: '!startsAt',
        },
      ];
      this.sortKey = this.sortOptions[0];
    });
  }

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

  isActive(alert: AppAlert): boolean {
    const now = new Date();
    return alert.startsAt <= now && alert.endsAt >= now;
  }
}
