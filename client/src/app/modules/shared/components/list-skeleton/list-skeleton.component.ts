import { Component } from '@angular/core';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';

@Component({
  selector: 'lc-list-skeleton',
  imports: [HlmSkeleton],
  templateUrl: './list-skeleton.component.html',
  styleUrl: './list-skeleton.component.scss',
})
export class ListSkeletonComponent {
  protected readonly rows = [1, 2, 3, 4, 5, 6];
}
