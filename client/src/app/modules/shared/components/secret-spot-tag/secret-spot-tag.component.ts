import { Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEyeOff } from '@ng-icons/lucide';
import { TranslocoDirective } from '@jsverse/transloco';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { injectDisableHeaderChipTooltip } from '../header-chip-tooltip';

@Component({
  selector: 'lc-secret-spot-tag',
  imports: [TranslocoDirective, HlmBadge, HlmTooltip, NgIcon],
  providers: [provideIcons({ lucideEyeOff })],
  templateUrl: './secret-spot-tag.component.html',
  styleUrl: './secret-spot-tag.component.scss',
})
export class SecretSpotTagComponent {
  protected readonly disableTooltip = injectDisableHeaderChipTooltip();
}
