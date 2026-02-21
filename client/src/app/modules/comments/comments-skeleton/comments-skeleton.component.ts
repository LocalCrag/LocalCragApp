import { Component } from '@angular/core';
import { Card } from 'primeng/card';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'lc-comments-skeleton',
  imports: [Card, Skeleton],
  templateUrl: './comments-skeleton.component.html',
  styleUrl: './comments-skeleton.component.scss',
})
export class CommentsSkeletonComponent {
  protected readonly Array = Array;
}
