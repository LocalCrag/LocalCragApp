import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye } from '@ng-icons/lucide';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { User } from '../../../../models/user';
import {
  userAvatarGradientCss,
  userInitials,
} from '../../../../utility/misc/user-avatar-gradient';

/**
 * Renders a user avatar using one of three template branches:
 *
 * 1. Preview image — when `[preview]` is true and the user has an avatar file.
 *    Clicking opens a dialog with the full image.
 *
 * 2. Avatar image — default when the user has an avatar and preview is off.
 *    Uses the configurable `thumbnail` input (usually `thumbnailS` or `thumbnailM`) so lists
 *    stay lightweight.
 *
 * 3. Initials — when there is no image URL (no avatar and no imageFallback).
 *    Shows generated initials on a deterministic gradient background.
 */
@Component({
  selector: 'lc-user-avatar',
  imports: [NgIcon, ...HlmAvatarImports, ...HlmDialogImports],
  providers: [provideIcons({ lucideEye })],
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent implements OnChanges {
  @Input() user: User | null | undefined;
  @Input() thumbnail: 'thumbnailS' | 'thumbnailM' = 'thumbnailS';
  @Input() size: 'normal' | 'large' | 'xlarge' = 'normal';
  @Input() styleClass = '';
  /** When set (e.g. deleted comment), always show this image and ignore avatar / initials. */
  @Input() imageFallback: string | null | undefined;
  /** Opens a fullscreen image preview when the user has an avatar. */
  @Input() preview = false;

  imageUrl: string | null = null;
  previewImageUrl: string | null = null;
  previewEnabled = false;
  previewOpen = false;
  previewStyleClass = '';
  initials = '';
  gradientStyle: Record<string, string> = {};
  fallbackClasses = '';
  ariaLabel = '';

  ngOnChanges(_: SimpleChanges) {
    const u = this.user;
    const first = u?.firstname ?? '';
    const last = u?.lastname ?? '';
    this.imageUrl =
      this.imageFallback?.trim() || u?.avatar?.[this.thumbnail] || null;
    this.initials = userInitials(first, last);
    const seed = u?.slug?.trim() || `${first}\u0000${last}` || this.initials;
    this.gradientStyle = { background: userAvatarGradientCss(seed) };

    this.fallbackClasses = [this.styleClass, 'lc-user-avatar--initials']
      .filter(Boolean)
      .join(' ');
    this.ariaLabel =
      u?.fullname?.trim() || `${first} ${last}`.trim() || this.initials;
    this.previewImageUrl = u?.avatar?.thumbnailXL ?? null;
    this.previewEnabled = this.preview && !!this.previewImageUrl;
    const previewClasses = [
      'lc-user-avatar-preview',
      `lc-user-avatar-preview--${this.size}`,
      this.styleClass,
    ];
    this.previewStyleClass = previewClasses.filter(Boolean).join(' ');
  }

  get avatarSize(): 'default' | 'lg' {
    return this.size === 'normal' ? 'default' : 'lg';
  }

  get avatarClass(): string {
    const sizeClass =
      this.size === 'xlarge'
        ? 'size-16'
        : this.size === 'large'
          ? 'size-12'
          : '';
    return [this.styleClass, sizeClass].filter(Boolean).join(' ');
  }
}
