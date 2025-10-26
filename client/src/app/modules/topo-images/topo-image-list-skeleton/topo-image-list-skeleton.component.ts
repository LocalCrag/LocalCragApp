import { Component } from '@angular/core';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'lc-topo-image-list-skeleton',
  imports: [Skeleton],
  templateUrl: './topo-image-list-skeleton.component.html',
  styleUrl: './topo-image-list-skeleton.component.scss',
})
export class TopoImageListSkeletonComponent {
  protected readonly Array = Array;
}
