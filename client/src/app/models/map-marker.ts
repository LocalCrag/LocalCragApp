import {AbstractModel} from './abstract-model';
import {MapMarkerType} from '../enums/map-marker-type';
import {GPS} from '../interfaces/gps.interface';

export type MapMarkerProperties = {
  name: string;
  description: string;
  customIcon: string;
  color: string;
  type: MapMarkerType;
}

export class MapMarker extends AbstractModel {

  name: string;
  description: string;
  gps: GPS;
  customIcon: string;
  color: string;
  type: MapMarkerType;

  public  static deserialize(payload: any): MapMarker {
    const mapMarker = new MapMarker();
    AbstractModel.deserializeAbstractAttributes(mapMarker, payload);
    mapMarker.name = payload.name;
    mapMarker.description = payload.description;
    mapMarker.gps =  {lat: payload.lat, lng: payload.lng};
    mapMarker.customIcon = payload.customIcon;
    mapMarker.color = payload.color;
    mapMarker.type = payload.type;
    return mapMarker;
  }

  public static serialize(mapMarker: MapMarker): any {
    return {
      name: mapMarker.name,
      description: mapMarker.description,
      lat: mapMarker.gps.lat,
      lng: mapMarker.gps.lng,
      customIcon: mapMarker.customIcon,
      color: mapMarker.color,
      type: mapMarker.type
    };
  }

}
