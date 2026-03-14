import { Component } from '@angular/core';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'lc-comments-skeleton',
  imports: [Skeleton],
  templateUrl: './comments-skeleton.component.html',
  styleUrl: './comments-skeleton.component.scss',
})
export class CommentsSkeletonComponent {
  protected readonly Array = Array;
}
