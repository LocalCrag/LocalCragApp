import { Line } from './line';
import { Area } from './area';
import { Sector } from './sector';
import { Crag } from './crag';
import { User } from './user';

export type SearchableObject = Line | Area | Sector | Crag | User;

export class Searchable {
  name: string;
  id: string;
  line: Line;
  area: Area;
  sector: Sector;
  crag: Crag;
  user: User;

  public static deserialize(payload: any): Searchable {
    const searchable = new Searchable();
    switch (payload.type) {
      case 'LINE':
        searchable.line = Line.deserialize(payload.item);
        searchable.name = searchable.line.name;
        searchable.id = searchable.line.id;
        break;
      case 'AREA':
        searchable.area = Area.deserialize(payload.item);
        searchable.name = searchable.area.name;
        searchable.id = searchable.area.id;
        break;
      case 'SECTOR':
        searchable.sector = Sector.deserialize(payload.item);
        searchable.name = searchable.sector.name;
        searchable.id = searchable.sector.id;
        break;
      case 'CRAG':
        searchable.crag = Crag.deserialize(payload.item);
        searchable.name = searchable.crag.name;
        searchable.id = searchable.crag.id;
        break;
      case 'USER':
        searchable.user = User.deserialize(payload.item);
        searchable.name = searchable.user.fullname;
        searchable.id = searchable.user.id;
        break;
    }
    return searchable;
  }

  public static fromObject(object: SearchableObject): Searchable {
    const searchable = new Searchable();
    if (object instanceof Line) {
      searchable.line = object;
      searchable.name = object.name;
      searchable.id = object.id;
    }
    if (object instanceof Area) {
      searchable.area = object;
      searchable.name = object.name;
      searchable.id = object.id;
    }
    if (object instanceof Sector) {
      searchable.sector = object;
      searchable.name = object.name;
      searchable.id = object.id;
    }
    if (object instanceof Crag) {
      searchable.crag = object;
      searchable.name = object.name;
      searchable.id = object.id;
    }
    if (object instanceof User) {
      searchable.user = object;
      searchable.name = object.fullname;
      searchable.id = object.id;
    }
    return searchable;
  }
}
