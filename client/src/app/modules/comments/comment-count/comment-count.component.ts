import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMessageSquare } from '@ng-icons/lucide';
import { TranslocoDirective } from '@jsverse/transloco';
import { HlmBadge } from '@spartan-ng/helm/badge';

@Component({
  selector: 'lc-comment-count',
  imports: [HlmBadge, NgIcon, TranslocoDirective],
  providers: [provideIcons({ lucideMessageSquare })],
  templateUrl: './comment-count.component.html',
  styleUrl: './comment-count.component.scss',
})
export class CommentCountComponent {
  @Input() commentCount = 0;
  @Input() routerLink: string | null = null;

  private router = inject(Router);

  get displayCount(): string {
    return this.commentCount > 9 ? '9+' : String(this.commentCount);
  }

  onClick(event: MouseEvent) {
    if (!this.routerLink) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    void this.router.navigateByUrl(this.routerLink);
  }
}
