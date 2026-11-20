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
import { select, Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { PageTitleService } from '../../../services/core/page-title.service';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { AdminMessage } from '../../../models/admin-message';
import { AdminMessagesService } from '../../../services/crud/admin-messages.service';
import { FormsModule } from '@angular/forms';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { Observable } from 'rxjs';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import { lucideFilePen, lucideInfo, lucidePlus } from '@ng-icons/lucide';

interface SelectItem<T = any> {
  label?: string;
  value?: T;
  [key: string]: any;
}

@Component({
  providers: [provideIcons({ lucideFilePen, lucideInfo, lucidePlus })],
  selector: 'lc-admin-messages-list',
  imports: [
    RouterLink,
    TranslocoDirective,
    FormsModule,
    NgClass,
    DatePipe,
    HlmButton,
    HlmAlert,
    HlmAlertDescription,
    ...HlmSelectImports,
    NgIcon,
  ],
  templateUrl: './admin-messages-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './admin-messages-list.component.scss',
})
export class AdminMessagesListComponent implements OnInit {
  public messages: AdminMessage[];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public sortOptions: SelectItem[];
  public sortKey: SelectItem;
  public sortOrder: number;
  public sortField: string;
  public isMobile$: Observable<boolean>;
  public adminMessagesService = inject(AdminMessagesService);

  private store = inject(Store);
  private title = inject(Title);
  private translocoService = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);

  ngOnInit() {
    this.pageTitleService.setTitle(
      this.translocoService.translate(
        marker('adminMessages.list.adminMessagesListTitle'),
      ),
      {
        info: this.translocoService.translate(
          marker('adminMessages.list.infoTooltip'),
        ),
      },
    );
    this.refreshData();
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.store.select(selectInstanceName).subscribe((instanceName) => {
      this.title.setTitle(
        `${this.translocoService.translate(marker('adminMessagesListBrowserTitle'))} - ${instanceName}`,
      );
    });
  }

  refreshData() {
    this.adminMessagesService.getAllMessages().subscribe((messages) => {
      this.messages = messages;
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
