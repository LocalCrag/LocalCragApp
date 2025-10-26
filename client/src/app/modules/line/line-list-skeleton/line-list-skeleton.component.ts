import { Component } from '@angular/core';

import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'lc-line-list-skeleton',
  imports: [Skeleton],
  templateUrl: './line-list-skeleton.component.html',
  styleUrl: './line-list-skeleton.component.scss',
})
export class LineListSkeletonComponent {
  protected readonly Array = Array;
}
