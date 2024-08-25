import {AfterViewInit, Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';

import {LngLat, LngLatBounds, Map as MaplibreMap, Marker, NavigationControl} from 'maplibre-gl';
import {MapsService} from '../../../services/crud/maps.service';
import {Feature, FeatureCollection, Geometry, Point} from 'geojson';
import {MapMarkerProperties} from '../../../models/map-marker';
import {MapItemInfoDialogComponent} from '../map-item-info-dialog/map-item-info-dialog.component';


@Component({
  selector: 'lc-map',
  standalone: true,
  imports: [
    MapItemInfoDialogComponent
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements AfterViewInit, OnDestroy {

  map: MaplibreMap | undefined;

  @ViewChild('map')
  private mapContainer!: ElementRef<HTMLElement>;
  @ViewChild(MapItemInfoDialogComponent)
  private infoDialog: MapItemInfoDialogComponent | undefined;
  private markersSource: FeatureCollection<Point, MapMarkerProperties> | undefined;

  constructor(private mapsService: MapsService) {
  }

  ngAfterViewInit() {
    this.mapsService.getMarkersGeoJSON('?type=CRAG').subscribe(markersSource => {
      this.markersSource = markersSource;
      this.map = new MaplibreMap({
        container: this.mapContainer.nativeElement,
        style: `https://api.maptiler.com/maps/topo-v2/style.json?key=7b2w9wLXnvsNVooKP1Je`,
        zoom: 10
      });
      this.map.addControl(new NavigationControl({}), 'top-right');
      this.map.on('load', async () => {
        // Add image icon as rasterized SVG
        let img = new Image(100, 100)
        img.onload = () => {
          this.map.addImage('rock', img);
          this.addSource()
          this.addLayers()
          this.setupClickActions()
          this.setupCursors()
        }
        img.src = 'assets/icons/rock.svg'
      })
      this.fitBounds()
    });
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  fitBounds() {
    const lngs = this.markersSource.features.map(feature => feature.geometry.coordinates[0]);
    const lats = this.markersSource.features.map(feature => feature.geometry.coordinates[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const sw = new LngLat(minLng, minLat);
    const ne = new LngLat(maxLng, maxLat);
    const bounds = new LngLatBounds(sw, ne);
    this.map.fitBounds(bounds, {duration: 0, padding: {top: 50, bottom: 50, left: 25, right: 25}});
  }

  addSource() {
    this.map.addSource('mapMarkers', {
      'type': 'geojson',
      'data': this.markersSource,
      cluster: true,
      clusterRadius: 50,
      clusterMinPoints: 2,
      tolerance: 0,
    });
  }

  addLayers() {
    this.map.addLayer({
      'id': 'rocks',
      'type': 'symbol',
      'source': 'mapMarkers',
      filter: ['!', ['has', 'point_count']],
      'layout': {
        'text-field': ['get', 'name'],
        'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
        'text-radial-offset': 1.5,
        'text-justify': 'auto',
        'icon-image': 'rock',
        'icon-size': .4,
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    });

    this.map.addLayer({
      id: 'clusters',
      type: 'symbol',
      source: 'mapMarkers',
      filter: ['has', 'point_count'],
      'layout': {
        'text-field': ['concat', ['get', 'point_count'], ' Gebiete'],
        'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
        'text-radial-offset': 2.5,
        'text-justify': 'auto',
        'icon-image': 'rock',
        'icon-size': .8
      },
    });
  }

  setupCursors() {
    this.map.on('mouseenter', 'clusters', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'clusters', () => {
      this.map.getCanvas().style.cursor = '';
    });
    this.map.on('mouseenter', 'rocks', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'rocks', () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  setupClickActions() {
    this.map.on('click', 'clusters', async (e) => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      const clusterId = features[0].properties.cluster_id;
      const zoom = await (this.map.getSource('mapMarkers') as any).getClusterExpansionZoom(clusterId);
      this.map.easeTo({
        center: (features[0].geometry as any).coordinates,
        zoom
      });
    });
    this.map.on('click', 'rocks', (e) => {
      this.infoDialog.open(e.features[0] as unknown as Feature<Geometry, MapMarkerProperties>);
    });
  }


}
