import {AbstractModel} from './abstract-model';
import {MapMarkerType} from '../enums/map-marker-type';
import {Coordinates} from '../interfaces/coordinates.interface';
import {Crag} from './crag';
import {Sector} from './sector';
import {Area} from './area';
import {TopoImage} from './topo-image';

export type MapMarkerProperties = {
  name: string;
  description: string;
  type: MapMarkerType;
  crag: Partial<Crag>;
  sector: Partial<Sector>;
  area: Partial<Area>;
  topoImage: Partial<TopoImage>;
};

export class MapMarker extends AbstractModel {
  name: string;
  description: string;
  coordinates: Coordinates;
  customIcon: string;
  color: string;
  type: MapMarkerType;

  public static deserialize(payload: any): MapMarker {
    const mapMarker = new MapMarker();
    AbstractModel.deserializeAbstractAttributes(mapMarker, payload);
    mapMarker.name = payload.name;
    mapMarker.description = payload.description;
    mapMarker.coordinates = { lat: payload.lat, lng: payload.lng };
    mapMarker.customIcon = payload.customIcon;
    mapMarker.color = payload.color;
    mapMarker.type = payload.type;
    return mapMarker;
  }

  public static serialize(mapMarker: MapMarker): any {
    return {
      name: mapMarker.name,
      description: mapMarker.description,
      lat: mapMarker.coordinates.lat,
      lng: mapMarker.coordinates.lng,
      customIcon: mapMarker.customIcon,
      color: mapMarker.color,
      type: mapMarker.type,
    };
  }
}
