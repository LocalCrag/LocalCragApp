import { Component, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { LoadingState } from '../../../enums/loading-state';
import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { LineModule } from '../../line/line.module';
import { RatingModule } from 'primeng/rating';
import {
  ConfirmationService,
  MenuItem,
  PrimeIcons,
  SelectItem,
} from 'primeng/api';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { Store } from '@ngrx/store';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import {
  selectCurrentUser,
  selectIsAdmin,
} from '../../../ngrx/selectors/auth.selectors';
import { User } from '../../../models/user';
import { UsersService } from '../../../services/crud/users.service';
import { FormsModule } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { MenuModule } from 'primeng/menu';
import { take } from 'rxjs/operators';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { environment } from '../../../../environments/environment';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { UserPromotionTargets } from '../../../enums/user-promotion-targets';
import { Select } from 'primeng/select';
import { UserListSkeletonComponent } from '../user-list-skeleton/user-list-skeleton.component';
import { Message } from 'primeng/message';
import { DatePipe } from '../../shared/pipes/date.pipe';

@Component({
  selector: 'lc-user-list',
  imports: [
    CardModule,
    TranslocoDirective,
    AsyncPipe,
    ButtonModule,
    DataViewModule,
    LineModule,
    NgForOf,
    NgIf,
    RatingModule,
    NgClass,
    FormsModule,
    AvatarModule,
    TagModule,
    ChipModule,
    MenuModule,
    ConfirmPopupModule,
    ConfirmDialogModule,
    Select,
    UserListSkeletonComponent,
    Message,
    DatePipe,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
  providers: [ConfirmationService],
})
export class UserListComponent implements OnInit {
  public users: User[];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public sortOptions: SelectItem[];
  public sortKey: SelectItem;
  public sortOrder: number;
  public sortField: string;
  public currentUser: User;
  public dynamicMenuItems$: BehaviorSubject<MenuItem[]> = new BehaviorSubject(
    [] as MenuItem[],
  );

  constructor(
    private usersService: UsersService,
    private confirmationService: ConfirmationService,
    private store: Store,
    private translocoService: TranslocoService,
  ) {}

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    forkJoin([
      this.usersService.getUsers(),
      this.store.select(selectCurrentUser).pipe(take(1)),
    ]).subscribe(([users, currentUser]) => {
      this.currentUser = currentUser;
      this.users = users;
      this.loading = LoadingState.DEFAULT;
      this.sortOptions = [
        {
          icon: PrimeIcons.SORT_ALPHA_DOWN,
          label: this.translocoService.translate(marker('sortAZ')),
          value: '!fullname',
        },
        {
          icon: 'pi pi-sort-alpha-down-alt',
          label: this.translocoService.translate(marker('sortZA')),
          value: 'fullname',
        },
      ];
      this.sortKey = this.sortOptions[0];
    });
  }

  /**
   * Using a BehaviourSubject as workaround for: https://github.com/primefaces/primeng/issues/13934
   */
  showUserMenu(user: User) {
    this.store
      .select(selectIsAdmin)
      .pipe(take(1))
      .subscribe((isAdmin) => {
        this.dynamicMenuItems$.next([
          {
            icon: 'pi pi-fw pi-user',
            label: this.translocoService.translate(
              marker('usersMenu.promoteToUser'),
            ),
            visible: user.member && !user.superadmin,
            command: () => {
              this.promoteUser(user, UserPromotionTargets.USER);
            },
          },
          {
            icon: 'pi pi-fw pi-heart-fill',
            label: this.translocoService.translate(
              marker('usersMenu.promoteToMember'),
            ),
            visible:
              (!user.member || user.moderator || user.admin) &&
              !user.superadmin,
            command: () => {
              this.promoteUser(user, UserPromotionTargets.MEMBER);
            },
          },
          {
            icon: 'pi pi-fw pi-star-fill',
            label: this.translocoService.translate(
              marker('usersMenu.promoteToModerator'),
            ),
            visible: (!user.moderator || user.admin) && !user.superadmin,
            command: () => {
              this.promoteUser(user, UserPromotionTargets.MODERATOR);
            },
          },
          {
            icon: 'pi pi-fw pi-key',
            label: this.translocoService.translate(
              marker('usersMenu.promoteToAdmin'),
            ),
            visible: !user.admin && !user.superadmin,
            command: () => {
              this.promoteUser(user, UserPromotionTargets.ADMIN);
            },
          },
          {
            icon: 'pi pi-fw pi-send',
            label: this.translocoService.translate(
              marker('usersMenu.resendUserCreatedMail'),
            ),
            visible: !user.activated,
            command: () => {
              this.resendUserCreatedMail(user);
            },
          },
          {
            icon: 'pi pi-fw pi-trash',
            label: this.translocoService.translate(marker('usersMenu.delete')),
            command: () => {
              this.confirmDeleteUser(user);
            },
            visible: isAdmin,
          },
        ]);
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

  resendUserCreatedMail(user: User) {
    this.usersService.resendUserCreateMail(user).subscribe(() => {
      this.store.dispatch(toastNotification('CREATE_USER_MAIL_SENT'));
    });
  }

  confirmDeleteUser(user: User) {
    this.translocoService.load(`${environment.language}`).subscribe(() => {
      this.confirmationService.confirm({
        header: this.translocoService.translate(
          marker('users.askReallyWantToDeleteUserTitle'),
        ),
        message: this.translocoService.translate(
          marker('users.askReallyWantToDeleteUser'),
          { username: user.fullname },
        ),
        acceptLabel: this.translocoService.translate(marker('users.yesDelete')),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(
          marker('users.noDontDelete'),
        ),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.deleteUser(user);
        },
      });
    });
  }

  deleteUser(user: User) {
    this.usersService.deleteUser(user).subscribe(() => {
      this.store.dispatch(toastNotification('USER_DELETED'));
      this.refreshData();
    });
  }

  promoteUser(user: User, promotionTarget: UserPromotionTargets) {
    this.usersService.promoteUser(user.id, promotionTarget).subscribe(() => {
      this.store.dispatch(toastNotification('USER_PROMOTED'));
      this.refreshData();
    });
  }
}
