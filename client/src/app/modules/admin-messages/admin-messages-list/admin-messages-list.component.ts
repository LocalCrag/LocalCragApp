import { Component, OnInit, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { RouterLink } from '@angular/router';
import { SelectItem } from 'primeng/api';
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
import { Select } from 'primeng/select';
import { Message } from 'primeng/message';
import { Observable } from 'rxjs';
import { DatePipe } from '../../shared/pipes/date.pipe';

@Component({
  selector: 'lc-admin-messages-list',
  imports: [
    ButtonModule,
    DataViewModule,
    RouterLink,
    TranslocoDirective,
    FormsModule,
    NgClass,
    Select,
    Message,
    DatePipe,
  ],
  templateUrl: './admin-messages-list.component.html',
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
}
