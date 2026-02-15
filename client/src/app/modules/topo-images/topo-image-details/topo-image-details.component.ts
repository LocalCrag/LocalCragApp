import { Component, Input, ViewEncapsulation } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TopoImage } from '../../../models/topo-image';

import { TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { CoordinatesButtonComponent } from '../../shared/components/coordinates-button/coordinates-button.component';
import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';

@Component({
  selector: 'lc-topo-image-details',
  imports: [ButtonModule, CoordinatesButtonComponent, SanitizeHtmlPipe],
  templateUrl: './topo-image-details.component.html',
  styleUrl: './topo-image-details.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'topoImage' }],
})
export class TopoImageDetailsComponent {
  @Input() topoImage: TopoImage;
}
