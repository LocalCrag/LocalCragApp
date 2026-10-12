import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ImageModule } from 'primeng/image';
import { SpeedDialModule } from 'primeng/speeddial';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'lc-gallery-image-skeleton',
  imports: [CardModule, ImageModule, SpeedDialModule, SkeletonModule],
  templateUrl: './gallery-image-skeleton.component.html',
  styleUrl: './gallery-image-skeleton.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class GalleryImageSkeletonComponent {
  /** CSS aspect-ratio (width / height). Omit to keep the fixed 300px frame. */
  @Input() aspectRatio: string | null = null;
}
