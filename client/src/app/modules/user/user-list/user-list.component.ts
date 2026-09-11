import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { LoadingState } from '../../../enums/loading-state';
import { NgClass } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import {
  ConfirmationService,
  MenuItem,
  PrimeIcons,
  SelectItem,
} from 'primeng/api';
import { forkJoin } from 'rxjs';
import { Store } from '@ngrx/store';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import {
  selectCurrentUser,
  selectIsAdmin,
} from '../../../ngrx/selectors/auth.selectors';
import { User } from '../../../models/user';
import { UsersService } from '../../../services/crud/users.service';
import { FormsModule } from '@angular/forms';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { UserRoleTagComponent } from '../../shared/components/user-role-tag/user-role-tag.component';
import { Menu, MenuModule } from 'primeng/menu';
import { take } from 'rxjs/operators';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { UserPromotionTargets } from '../../../enums/user-promotion-targets';
import { Select } from 'primeng/select';
import { UserListSkeletonComponent } from '../user-list-skeleton/user-list-skeleton.component';
import { Message } from 'primeng/message';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { PageTitleService } from '../../../services/core/page-title.service';
import { RouterLink } from '@angular/router';
import { InputText } from 'primeng/inputtext';

@Component({
  selector: 'lc-user-list',
  imports: [
    TranslocoDirective,
    ButtonModule,
    DataViewModule,
    NgClass,
    FormsModule,
    UserAvatarComponent,
    UserRoleTagComponent,
    MenuModule,
    ConfirmDialogModule,
    Select,
    UserListSkeletonComponent,
    Message,
    DatePipe,
    RouterLink,
    InputText,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
  providers: [ConfirmationService],
})
export class UserListComponent implements OnInit {
  @ViewChild('userMenu') userMenu: Menu;

  public users: User[] = [];
  public filteredUsers: User[] | null = null;
  public searchQuery = '';
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public sortOptions: SelectItem[];
  public sortKey: SelectItem;
  public sortOrder: number;
  public sortField: string;
  public currentUser: User;
  public userActionItems: MenuItem[] = [];

  private isAdmin = false;
  private clickedUser: User | null = null;
  private usersService = inject(UsersService);
  private confirmationService = inject(ConfirmationService);
  private store = inject(Store);
  private translocoService = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);

  ngOnInit() {
    this.pageTitleService.setTitle(
      this.translocoService.translate(marker('users.list.userListTitle')),
    );
    this.refreshData();
  }

  refreshData() {
    forkJoin([
      this.usersService.getUsers(),
      this.store.select(selectCurrentUser).pipe(take(1)),
      this.store.select(selectIsAdmin).pipe(take(1)),
    ]).subscribe(([users, currentUser, isAdmin]) => {
      this.currentUser = currentUser;
      this.isAdmin = isAdmin;
      this.users = users;
      this.applyFilter();
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

  onSearchChange(query: string) {
    this.searchQuery = query;
    this.applyFilter();
  }

  applyFilter() {
    const q = this.searchQuery.trim().toLocaleLowerCase();
    if (!q) {
      this.filteredUsers = this.users;
      return;
    }
    this.filteredUsers = this.users.filter((user) => {
      const name = (user.fullname ?? '').toLocaleLowerCase();
      const email = (user.email ?? '').toLocaleLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }

  isUserActionsEnabled(user: User): boolean {
    if (!this.currentUser || this.currentUser.id === user.id) {
      return false;
    }
    // Superadmins (and other admins for non-superadmin viewers): show menu disabled
    if (user.superadmin || (user.admin && !this.currentUser.superadmin)) {
      return false;
    }
    return true;
  }

  openUserActions(event: Event, user: User) {
    event.preventDefault();
    event.stopPropagation();
    this.clickedUser = user;
    this.userActionItems = this.buildUserActionItems();
    this.userMenu.toggle(event);
  }

  private buildUserActionItems(): MenuItem[] {
    const user = this.clickedUser;
    if (!user) {
      return [];
    }
    return [
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
          (!user.member || user.moderator || user.admin) && !user.superadmin,
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
        visible: this.isAdmin,
      },
    ];
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
