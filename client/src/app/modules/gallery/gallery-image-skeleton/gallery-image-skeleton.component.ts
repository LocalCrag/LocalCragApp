import { Component, Input, ViewEncapsulation } from '@angular/core';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';

@Component({
  selector: 'lc-gallery-image-skeleton',
  imports: [HlmCardImports, HlmSkeleton],
  templateUrl: './gallery-image-skeleton.component.html',
  styleUrl: './gallery-image-skeleton.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class GalleryImageSkeletonComponent {
  /** CSS aspect-ratio (width / height). Omit to keep the fixed 300px frame. */
  @Input() aspectRatio: string | null = null;
}
