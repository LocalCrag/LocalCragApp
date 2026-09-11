import { Component, Input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { TranslocoDirective } from '@jsverse/transloco';
import { User } from '../../../../models/user';

type UserRoleTag = {
  key: 'superadmin' | 'admin' | 'moderator' | 'member';
  severity?: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
};

/**
 * Highest-role PrimeNG tag, matching the exclusive hierarchy used in the user list.
 */
@Component({
  selector: 'lc-user-role-tag',
  imports: [TagModule, TranslocoDirective],
  templateUrl: './user-role-tag.component.html',
  styleUrl: './user-role-tag.component.scss',
})
export class UserRoleTagComponent {
  @Input({ required: true }) user: User | null | undefined;
  @Input() dataCy: string | null = null;

  protected get role(): UserRoleTag | null {
    const user = this.user;
    if (!user) {
      return null;
    }
    if (user.superadmin) {
      return { key: 'superadmin', severity: 'danger' };
    }
    if (user.admin) {
      return { key: 'admin', severity: 'success' };
    }
    if (user.moderator) {
      return { key: 'moderator' };
    }
    if (user.member) {
      return { key: 'member', severity: 'info' };
    }
    return null;
  }
}
