import { Component, ViewEncapsulation } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ImageModule } from 'primeng/image';
import { NgForOf, NgIf } from '@angular/common';
import { SharedModule } from 'primeng/api';
import { SpeedDialModule } from 'primeng/speeddial';
import { TagComponent } from '../../shared/components/tag/tag.component';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'lc-gallery-image-skeleton',
  standalone: true,
  imports: [
    CardModule,
    ImageModule,
    NgForOf,
    NgIf,
    SharedModule,
    SpeedDialModule,
    TagComponent,
    SkeletonModule,
  ],
  templateUrl: './gallery-image-skeleton.component.html',
  styleUrl: './gallery-image-skeleton.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class GalleryImageSkeletonComponent {}
