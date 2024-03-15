import {Component, Input, ViewEncapsulation} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {TopoImage} from '../../../models/topo-image';
import {NgIf} from '@angular/common';
import {SharedModule} from '../../shared/shared.module';

@Component({
  selector: 'lc-topo-image-details',
  standalone: true,
  imports: [
    ButtonModule,
    NgIf,
    SharedModule
  ],
  templateUrl: './topo-image-details.component.html',
  styleUrl: './topo-image-details.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class TopoImageDetailsComponent {

  @Input() topoImage: TopoImage;

  openGPS(){
    window.open(`https://maps.google.com/?q=${this.topoImage.lat},${this.topoImage.lng}`)
  }

}
