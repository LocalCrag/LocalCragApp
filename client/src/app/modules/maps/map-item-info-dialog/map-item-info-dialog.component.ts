import {Component, ViewEncapsulation} from '@angular/core';
import {DialogModule} from 'primeng/dialog';
import {ButtonModule} from 'primeng/button';
import {MapMarkerProperties} from '../../../models/map-marker';
import {NgIf} from '@angular/common';
import {TranslocoDirective} from '@ngneat/transloco';
import {Feature, Geometry} from 'geojson';

@Component({
  selector: 'lc-map-item-info-dialog',
  standalone: true,
  imports: [
    DialogModule,
    ButtonModule,
    NgIf,
    TranslocoDirective
  ],
  templateUrl: './map-item-info-dialog.component.html',
  styleUrl: './map-item-info-dialog.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MapItemInfoDialogComponent {

  public isOpen: boolean = false;
  public feature: Feature<Geometry, MapMarkerProperties> | undefined;

  public open(feature: Feature<Geometry, MapMarkerProperties>){
    this.isOpen = true;
    this.feature = feature;
  }

  public close(){
    this.isOpen = false;
  }

  public openItem(){

  }

  public navigateToItem(){
    const coordinates = (this.feature.geometry as any).coordinates
    window.open(`https://maps.google.com/?q=${coordinates[1]},${coordinates[0]}`)
  }

}
