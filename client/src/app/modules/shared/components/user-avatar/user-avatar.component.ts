import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { ImageModule } from 'primeng/image';
import { User } from '../../../../models/user';
import {
  userAvatarGradientCss,
  userInitials,
} from '../../../../utility/misc/user-avatar-gradient';

/**
 * Renders a user avatar using one of three template branches:
 *
 * 1. `p-image` (preview) — when `[preview]` is true and the user has an avatar file.
 *    PrimeNG Avatar has no fullscreen preview; `p-image` provides the same click-to-zoom
 *    behaviour as gallery images. Both `[src]` and `[previewImageSrc]` are set to
 *    `thumbnailXL`: the former for the inline circle, the latter for the fullscreen overlay
 *    (PrimeNG falls back to `[src]` when `[previewImageSrc]` is omitted).
 *
 * 2. `p-avatar` with `[image]` — default when the user has an avatar and preview is off.
 *    Uses the configurable `thumbnail` input (usually `thumbnailS` or `thumbnailM`) so lists
 *    stay lightweight.
 *
 * 3. `p-avatar` with `[label]` — when there is no image URL (no avatar and no imageFallback).
 *    Shows generated initials on a deterministic gradient background.
 */
@Component({
  selector: 'lc-user-avatar',
  imports: [AvatarModule, ImageModule],
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent implements OnChanges {
  @Input() user: User | null | undefined;
  @Input() thumbnail: 'thumbnailS' | 'thumbnailM' = 'thumbnailS';
  @Input() size: 'normal' | 'large' | 'xlarge' = 'normal';
  @Input() class = '';
  /** When set (e.g. deleted comment), always show this image and ignore avatar / initials. */
  @Input() imageFallback: string | null | undefined;
  /** Opens a fullscreen image preview when the user has an avatar. */
  @Input() preview = false;

  imageUrl: string | null = null;
  previewImageUrl: string | null = null;
  previewEnabled = false;
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
    this.gradientStyle = this.imageUrl
      ? {}
      : { background: userAvatarGradientCss(seed) };

    this.fallbackClasses = [this.class, 'lc-user-avatar--initials']
      .filter(Boolean)
      .join(' ');
    this.ariaLabel =
      u?.fullname?.trim() || `${first} ${last}`.trim() || this.initials;
    this.previewImageUrl = u?.avatar?.thumbnailXL ?? null;
    this.previewEnabled = this.preview && !!this.previewImageUrl;
    const previewClasses = [
      'lc-user-avatar-preview',
      `lc-user-avatar-preview--${this.size}`,
      this.class,
    ];
    this.previewStyleClass = previewClasses.filter(Boolean).join(' ');
  }
}
