import { Component } from '@angular/core';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';

@Component({
  selector: 'lc-ascent-list-skeleton',
  imports: [HlmSkeleton],
  templateUrl: './ascent-list-skeleton.component.html',
  styleUrl: './ascent-list-skeleton.component.scss',
})
export class AscentListSkeletonComponent {
  protected readonly Array = Array;
}
