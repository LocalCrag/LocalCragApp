import { AbstractModel } from './abstract-model';
import { Sector } from './sector';
import { HistoryItemType } from '../enums/history-item-type';
import { Crag } from './crag';
import { Area } from './area';
import { Line } from './line';
import { ObjectType } from './tag';
import { deserializeObject } from './utils';

export class HistoryItem extends AbstractModel {
  oldValue: string;
  newValue: string;
  attributeName: string;
  type: HistoryItemType;
  object: Crag | Sector | Area | Line;
  objectType: ObjectType;

  public static deserialize(payload: any): HistoryItem {
    const historyItem = new HistoryItem();
    AbstractModel.deserializeAbstractAttributes(historyItem, payload);
    historyItem.oldValue = payload.oldValue;
    historyItem.newValue = payload.newValue;
    historyItem.attributeName = payload.attributeName;
    historyItem.type = payload.type;
    historyItem.object = payload.object
      ? (deserializeObject(payload.objectType, payload.object) as
          | Crag
          | Sector
          | Area
          | Line)
      : null;
    historyItem.objectType = payload.objectType;
    return historyItem;
  }
}
