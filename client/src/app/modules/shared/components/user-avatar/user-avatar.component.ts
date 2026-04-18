import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { User } from '../../../../models/user';
import {
  userAvatarGradientCss,
  userInitials,
} from '../../../../utility/misc/user-avatar-gradient';

@Component({
  selector: 'lc-user-avatar',
  imports: [AvatarModule],
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent implements OnChanges {
  @Input() user: User | null | undefined;
  @Input() thumbnail: 'thumbnailS' | 'thumbnailM' = 'thumbnailS';
  @Input() size: 'normal' | 'large' | 'xlarge' = 'normal';
  @Input() shape: 'circle' | 'square' = 'circle';
  @Input() styleClass = '';
  /** When set (e.g. deleted comment), always show this image and ignore avatar / initials. */
  @Input() imageFallback: string | null | undefined;

  imageUrl: string | null = null;
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

    this.fallbackClasses = [this.styleClass, 'lc-user-avatar--initials']
      .filter(Boolean)
      .join(' ');
    this.ariaLabel =
      u?.fullname?.trim() || `${first} ${last}`.trim() || this.initials;
  }
}
