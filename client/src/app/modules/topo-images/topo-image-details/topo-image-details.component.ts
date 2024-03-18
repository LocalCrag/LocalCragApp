import {Component, Input, ViewEncapsulation} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {TopoImage} from '../../../models/topo-image';
import {NgIf} from '@angular/common';
import {SharedModule} from '../../shared/shared.module';
import {TranslocoDirective} from '@ngneat/transloco';
import {GpsButtonComponent} from '../../shared/components/gps-button/gps-button.component';

@Component({
  selector: 'lc-topo-image-details',
  standalone: true,
  imports: [
    ButtonModule,
    NgIf,
    SharedModule,
    TranslocoDirective,
    GpsButtonComponent
  ],
  templateUrl: './topo-image-details.component.html',
  styleUrl: './topo-image-details.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class TopoImageDetailsComponent {

  @Input() topoImage: TopoImage;

}
