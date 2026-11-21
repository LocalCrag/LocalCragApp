import { Component } from '@angular/core';

import { HlmSkeleton } from '@spartan-ng/helm/skeleton';

@Component({
  selector: 'lc-ranking-list-skeleton',
  imports: [HlmSkeleton],
  templateUrl: './ranking-list-skeleton.component.html',
  styleUrl: './ranking-list-skeleton.component.scss',
})
export class RankingListSkeletonComponent {
  protected readonly Array = Array;
}
