import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { LoadingState } from '../../../enums/loading-state';
import { forkJoin } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { PageTitleService } from '../../../services/core/page-title.service';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { AppAlertSeverity } from '../../../enums/app-alert-severity';
import { AppAlert } from '../../../models/app-alert';
import { AppAlertsService } from '../../../services/crud/app-alerts.service';
import { FormsModule } from '@angular/forms';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { Observable } from 'rxjs';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import { lucideFilePen, lucideInfo, lucidePlus } from '@ng-icons/lucide';
import { ListSkeletonComponent } from '../../shared/components/list-skeleton/list-skeleton.component';

interface SelectItem<T = any> {
  label?: string;
  value?: T;
  [key: string]: any;
}

@Component({
  providers: [provideIcons({ lucideFilePen, lucideInfo, lucidePlus })],
  selector: 'lc-app-alerts-list',
  imports: [
    RouterLink,
    TranslocoDirective,
    TranslocoPipe,
    FormsModule,
    NgClass,
    HlmButton,
    HlmAlert,
    HlmAlertDescription,
    ...HlmSelectImports,
    HlmBadge,
    ListSkeletonComponent,
    NgIcon,
  ],
  templateUrl: './app-alerts-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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
      {
        info: this.translocoService.translate(
          marker('appAlerts.appAlertList.infoTooltip'),
        ),
      },
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

  severityChipClass(severity: AppAlertSeverity): string {
    switch (severity) {
      case AppAlertSeverity.WARNING:
        return 'border-transparent bg-yellow-700 text-white';
      case AppAlertSeverity.DANGER:
        return 'border-transparent bg-red-700 text-white';
      default:
        return 'border-transparent bg-blue-700 text-white';
    }
  }

  isActive(alert: AppAlert): boolean {
    const now = new Date();
    return alert.startsAt <= now && alert.endsAt >= now;
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
