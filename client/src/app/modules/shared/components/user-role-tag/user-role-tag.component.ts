import { Component, Input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { User } from '../../../../models/user';

type UserRoleTag = {
  key: 'superadmin' | 'admin' | 'moderator' | 'member';
  severity?: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
};

/**
 * Highest-role badge, matching the exclusive hierarchy used in the user list.
 */
@Component({
  selector: 'lc-user-role-tag',
  imports: [HlmBadge, TranslocoDirective],
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

  protected badgeVariant(
    severity: UserRoleTag['severity'],
  ): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (severity === 'danger') {
      return 'destructive';
    }
    if (severity === 'secondary') {
      return 'secondary';
    }
    if (severity === 'contrast') {
      return 'outline';
    }
    return 'default';
  }

  protected badgeClass(severity: UserRoleTag['severity']): string {
    switch (severity) {
      case 'success':
        return 'border-transparent bg-emerald-600 text-white';
      case 'info':
        return 'border-transparent bg-sky-600 text-white';
      case 'warn':
        return 'border-transparent bg-amber-500 text-white';
      default:
        return '';
    }
  }
}
