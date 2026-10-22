import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Store } from '@ngrx/store';
import { ButtonModule } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Select } from 'primeng/select';
import { forkJoin } from 'rxjs';
import { UserPromotionTargets } from '../../../enums/user-promotion-targets';
import { User } from '../../../models/user';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { UsersService } from '../../../services/crud/users.service';

export interface UserRightsDialogData {
  userId: string;
  role: UserPromotionTargets;
  suggestionsEnabled: boolean;
}

export function userPromotionTarget(user: User): UserPromotionTargets {
  if (user.admin) {
    return UserPromotionTargets.ADMIN;
  }
  if (user.moderator) {
    return UserPromotionTargets.MODERATOR;
  }
  if (user.member) {
    return UserPromotionTargets.MEMBER;
  }
  return UserPromotionTargets.USER;
}

@Component({
  selector: 'lc-user-rights-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslocoDirective, ButtonModule, Checkbox, Select],
  templateUrl: './user-rights-dialog.component.html',
  styleUrl: './user-rights-dialog.component.scss',
})
export class UserRightsDialogComponent {
  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);
  private usersService = inject(UsersService);
  private translocoService = inject(TranslocoService);
  private store = inject(Store);
  private changeDetector = inject(ChangeDetectorRef);

  private readonly data = this.config.data as UserRightsDialogData;
  selectedRole = this.data.role;
  suggestionsEnabled = this.data.suggestionsEnabled;
  saving = false;
  roleOptions = [
    UserPromotionTargets.USER,
    UserPromotionTargets.MEMBER,
    UserPromotionTargets.MODERATOR,
    UserPromotionTargets.ADMIN,
  ].map((value) => ({
    value,
    label: this.translocoService.translate(this.roleLabel(value)),
  }));

  get showSuggestionRight(): boolean {
    return (
      this.selectedRole === UserPromotionTargets.USER ||
      this.selectedRole === UserPromotionTargets.MEMBER
    );
  }

  get selectedRoleLabel(): string {
    return (
      this.roleOptions.find((option) => option.value === this.selectedRole)
        ?.label ?? ''
    );
  }

  get roleHint(): string {
    return this.translocoService.translate(this.roleHintKey(this.selectedRole));
  }

  close(): void {
    this.ref.close(false);
  }

  save(): void {
    if (this.saving) {
      return;
    }
    const requests = [];
    const roleChanged = this.selectedRole !== this.data.role;
    if (roleChanged) {
      requests.push(
        this.usersService.promoteUser(this.data.userId, this.selectedRole),
      );
    }
    if (
      this.showSuggestionRight &&
      this.suggestionsEnabled !== this.data.suggestionsEnabled
    ) {
      requests.push(
        this.usersService.setSuggestionsEnabled(
          this.data.userId,
          this.suggestionsEnabled,
        ),
      );
    }
    if (requests.length === 0) {
      this.ref.close(false);
      return;
    }
    this.saving = true;
    forkJoin(requests).subscribe({
      next: () => {
        this.store.dispatch(toastNotification('USER_PROMOTED'));
        this.ref.close(true);
      },
      error: () => {
        this.saving = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  private roleLabel(role: UserPromotionTargets): string {
    switch (role) {
      case UserPromotionTargets.MEMBER:
        return marker('users.rightsDialog.roleMember');
      case UserPromotionTargets.MODERATOR:
        return marker('users.rightsDialog.roleModerator');
      case UserPromotionTargets.ADMIN:
        return marker('users.rightsDialog.roleAdmin');
      default:
        return marker('users.rightsDialog.roleUser');
    }
  }

  private roleHintKey(role: UserPromotionTargets): string {
    switch (role) {
      case UserPromotionTargets.MEMBER:
        return marker('users.rightsDialog.roleMemberHint');
      case UserPromotionTargets.MODERATOR:
        return marker('users.rightsDialog.roleModeratorHint');
      case UserPromotionTargets.ADMIN:
        return marker('users.rightsDialog.roleAdminHint');
      default:
        return marker('users.rightsDialog.roleUserHint');
    }
  }
}
