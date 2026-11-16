import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { TranslocoDirective } from '@jsverse/transloco';
import { HlmBadge } from '@spartan-ng/helm/badge';

@Component({
  selector: 'lc-ascent-count',
  imports: [HlmBadge, NgIcon, TranslocoDirective],
  providers: [provideIcons({ lucideCheck })],
  templateUrl: './ascent-count.component.html',
  styleUrl: './ascent-count.component.scss',
})
export class AscentCountComponent {
  @Input() ascentCount = 0;
  @Input() routerLink: string | null = null;

  private router = inject(Router);

  onClick(event: MouseEvent) {
    if (!this.routerLink) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    void this.router.navigateByUrl(this.routerLink);
  }
}
