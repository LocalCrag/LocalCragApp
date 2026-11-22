import { Component } from '@angular/core';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';

@Component({
  selector: 'lc-comments-skeleton',
  imports: [HlmSkeleton],
  templateUrl: './comments-skeleton.component.html',
  styleUrl: './comments-skeleton.component.scss',
})
export class CommentsSkeletonComponent {
  protected readonly Array = Array;
}
