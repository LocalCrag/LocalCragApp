import { Line } from './line';
import { Area } from './area';
import { Sector } from './sector';
import { Crag } from './crag';
import { User } from './user';

export class Searchable {
  name: string;
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
        break;
      case 'AREA':
        searchable.area = Area.deserialize(payload.item);
        searchable.name = searchable.area.name;
        break;
      case 'SECTOR':
        searchable.sector = Sector.deserialize(payload.item);
        searchable.name = searchable.sector.name;
        break;
      case 'CRAG':
        searchable.crag = Crag.deserialize(payload.item);
        searchable.name = searchable.crag.name;
        break;
      case 'USER':
        searchable.user = User.deserialize(payload.item);
        searchable.name = searchable.user.fullname;
        break;
    }
    return searchable;
  }
}
