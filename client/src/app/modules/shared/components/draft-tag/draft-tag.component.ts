import { Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil } from '@ng-icons/lucide';
import { TranslocoDirective } from '@jsverse/transloco';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';

@Component({
  selector: 'lc-draft-tag',
  imports: [TranslocoDirective, HlmBadge, HlmTooltip, NgIcon],
  providers: [provideIcons({ lucidePencil })],
  templateUrl: './draft-tag.component.html',
  styleUrl: './draft-tag.component.scss',
})
export class DraftTagComponent {}
