import { AbstractModel } from './abstract-model';
import { HistoryItemType } from '../enums/history-item-type';
import { User } from './user';
import { deserializeLCObject, LCObject, ObjectType } from './object';

export class HistoryItem extends AbstractModel {
  oldValue: string;
  newValue: string;
  attributeName: string;
  type: HistoryItemType;
  object: LCObject;
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
      ? deserializeLCObject(payload.objectType, payload.object)
      : null;
    historyItem.objectType = payload.objectType;
    historyItem.createdBy = payload.createdBy
      ? User.deserialize(payload.createdBy)
      : null;
    return historyItem;
  }
}
