import { Component } from '@angular/core';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';

@Component({
  selector: 'lc-topo-image-list-skeleton',
  imports: [HlmSkeleton],
  templateUrl: './topo-image-list-skeleton.component.html',
  styleUrl: './topo-image-list-skeleton.component.scss',
})
export class TopoImageListSkeletonComponent {
  protected readonly Array = Array;
}
