import { Component, Input, ViewEncapsulation } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TopoImage } from '../../../models/topo-image';
import { NgIf } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { CoordinatesButtonComponent } from '../../shared/components/coordinates-button/coordinates-button.component';
import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';

@Component({
  selector: 'lc-topo-image-details',
  imports: [
    ButtonModule,
    NgIf,
    TranslocoDirective,
    CoordinatesButtonComponent,
    SanitizeHtmlPipe,
  ],
  templateUrl: './topo-image-details.component.html',
  styleUrl: './topo-image-details.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TopoImageDetailsComponent {
  @Input() topoImage: TopoImage;
}
