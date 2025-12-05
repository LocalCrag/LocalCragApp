import { AbstractModel } from './abstract-model';
import { Sector } from './sector';
import { HistoryItemType } from '../enums/history-item-type';
import { Crag } from './crag';
import { Area } from './area';
import { Line } from './line';
import { deserializeObject } from './utils';
import { User } from './user';
import { ObjectType } from './object';

export class HistoryItem extends AbstractModel {
  oldValue: string;
  newValue: string;
  attributeName: string;
  type: HistoryItemType;
  object: Crag | Sector | Area | Line; // TODO use LCObject
  objectType: ObjectType;
  createdBy: User;

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
    historyItem.createdBy = payload.createdBy
      ? User.deserialize(payload.createdBy)
      : null;
    return historyItem;
  }
}
