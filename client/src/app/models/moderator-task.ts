import { AbstractModel } from './abstract-model';
import { User } from './user';
import { deserializeLCObject, LCObject, ObjectType } from './object';

export class ModeratorTask extends AbstractModel {
  title: string;
  description: string;
  completed: boolean;
  timeFinished: Date;
  createdBy: User;
  assignedTo: User;
  finishedBy: User;
  object: LCObject;
  objectType: ObjectType;
  objectId: string;

  public static deserialize(payload: any): ModeratorTask {
    const task = new ModeratorTask();
    AbstractModel.deserializeAbstractAttributes(task, payload);
    task.title = payload.title;
    task.description = payload.description;
    task.completed = payload.completed;
    task.timeFinished = payload.timeFinished
      ? new Date(payload.timeFinished)
      : null;
    task.createdBy = payload.createdBy
      ? User.deserialize(payload.createdBy)
      : null;
    task.assignedTo = payload.assignedTo
      ? User.deserialize(payload.assignedTo)
      : null;
    task.finishedBy = payload.finishedBy
      ? User.deserialize(payload.finishedBy)
      : null;
    task.objectType = payload.objectType;
    task.objectId = payload.objectId;
    task.object = payload.object
      ? deserializeLCObject(payload.objectType, payload.object)
      : null;
    return task;
  }

  public static serializeForCreate(task: ModeratorTask): any {
    return {
      title: task.title,
      description: task.description,
      objectType: task.objectType,
      objectId: task.objectId,
      assignedToId: task.assignedTo?.id ?? null,
    };
  }

  public static serializeForUpdate(task: ModeratorTask): any {
    return {
      title: task.title,
      description: task.description,
      assignedToId: task.assignedTo?.id ?? null,
    };
  }
}
