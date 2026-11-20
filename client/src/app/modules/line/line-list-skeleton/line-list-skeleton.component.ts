import { Component } from '@angular/core';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';

@Component({
  selector: 'lc-line-list-skeleton',
  imports: [HlmSkeleton],
  templateUrl: './line-list-skeleton.component.html',
  styleUrl: './line-list-skeleton.component.scss',
})
export class LineListSkeletonComponent {
  protected readonly Array = Array;
}
