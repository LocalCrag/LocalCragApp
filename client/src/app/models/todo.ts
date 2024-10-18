import {AbstractModel} from './abstract-model';
import {Line} from './line';
import {Area} from './area';
import {Sector} from './sector';
import {Crag} from './crag';
import {TodoPriority} from '../enums/todo-priority';

export class Todo extends AbstractModel {
  priority: TodoPriority;
  line: Line;
  area: Area;
  sector: Sector;
  crag: Crag;

  // Helpers for easier template usage
  routerLinkCrag: string;
  routerLinkSector: string;
  routerLinkArea: string;
  routerLinkLine: string;

  public static deserialize(payload: any): Todo {
    const todo = new Todo();
    AbstractModel.deserializeAbstractAttributes(todo, payload);

    todo.priority = payload.priority;
    todo.line = Line.deserialize(payload.line);
    todo.area = Area.deserialize(payload.area);
    todo.sector = Sector.deserialize(payload.sector);
    todo.crag = Crag.deserialize(payload.crag);

    todo.routerLinkCrag = `/topo/${todo.crag.slug}`;
    todo.routerLinkSector = `${todo.routerLinkCrag}/${todo.sector.slug}`;
    todo.routerLinkArea = `${todo.routerLinkSector}/${todo.area.slug}`;
    todo.routerLinkLine = `${todo.routerLinkArea}/${todo.line.slug}`;

    return todo;
  }
}
