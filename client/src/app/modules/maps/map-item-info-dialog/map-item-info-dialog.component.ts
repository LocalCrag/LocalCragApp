import { Component, ViewEncapsulation } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MapMarkerProperties } from '../../../models/map-marker';
import { NgIf } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { Feature, Geometry } from 'geojson';
import { Router } from '@angular/router';
import { MapMarkerType } from '../../../enums/map-marker-type';

@Component({
  selector: 'lc-map-item-info-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, NgIf, TranslocoDirective],
  templateUrl: './map-item-info-dialog.component.html',
  styleUrl: './map-item-info-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class MapItemInfoDialogComponent {
  public isOpen: boolean = false;
  public feature: Feature<Geometry, MapMarkerProperties> | undefined;

  constructor(private router: Router) {}

  public open(feature: Feature<Geometry, MapMarkerProperties>) {
    this.isOpen = true;
    this.feature = feature;
  }

  public openItem() {
    if (this.feature.properties.crag) {
      this.router.navigate(['/topo', this.feature.properties.crag.slug]);
    }
    if (this.feature.properties.sector) {
      this.router.navigate([
        '/topo',
        this.feature.properties.sector.crag.slug,
        this.feature.properties.sector.slug,
      ]);
    }
    if (this.feature.properties.area) {
      this.router.navigate([
        '/topo',
        this.feature.properties.area.sector.crag.slug,
        this.feature.properties.area.sector.slug,
        this.feature.properties.area.slug,
      ]);
    }
    if (this.feature.properties.topoImage) {
      this.router.navigate(
        [
          '/topo',
          this.feature.properties.topoImage.area.sector.crag.slug,
          this.feature.properties.topoImage.area.sector.slug,
          this.feature.properties.topoImage.area.slug,
          'topo-images',
        ],
        { fragment: this.feature.properties.topoImage.id },
      );
    }
  }

  public navigateToItem() {
    const coordinates = (this.feature.geometry as any).coordinates;
    window.open(
      `https://maps.google.com/?q=${coordinates[1]},${coordinates[0]}`,
    );
  }

  public getCanOpenFeature() {
    return (
      this.feature?.properties &&
      (this.feature.properties.type === MapMarkerType.CRAG ||
        this.feature.properties.type === MapMarkerType.SECTOR ||
        this.feature.properties.type === MapMarkerType.AREA ||
        this.feature.properties.type === MapMarkerType.TOPO_IMAGE)
    );
  }
}
