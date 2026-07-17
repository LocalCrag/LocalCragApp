import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Chip } from 'primeng/chip';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'lc-comment-count',
  imports: [Chip, TranslocoDirective],
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
