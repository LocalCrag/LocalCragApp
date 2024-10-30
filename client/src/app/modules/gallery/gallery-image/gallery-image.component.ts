import { Component, Input, ViewEncapsulation } from '@angular/core';
import { GalleryImage } from '../../../models/gallery-image';
import { CardModule } from 'primeng/card';
import { ImageModule } from 'primeng/image';
import { NgForOf } from '@angular/common';
import { TagComponent } from '../../shared/components/tag/tag.component';

@Component({
  selector: 'lc-gallery-image',
  standalone: true,
  imports: [CardModule, ImageModule, NgForOf, TagComponent],
  templateUrl: './gallery-image.component.html',
  styleUrl: './gallery-image.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class GalleryImageComponent {
  @Input() image: GalleryImage;

  test(e) {
    console.log('test', e);
  }
}
