import { Component, ViewEncapsulation } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ImageModule } from 'primeng/image';
import { SharedModule } from 'primeng/api';
import { SpeedDialModule } from 'primeng/speeddial';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'lc-gallery-image-skeleton',
  imports: [
    CardModule,
    ImageModule,
    SharedModule,
    SpeedDialModule,
    SkeletonModule,
  ],
  templateUrl: './gallery-image-skeleton.component.html',
  styleUrl: './gallery-image-skeleton.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class GalleryImageSkeletonComponent {}
