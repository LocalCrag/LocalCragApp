import {Line} from './line';
import {Area} from './area';
import {Sector} from './sector';
import {Crag} from './crag';
import {User} from './user';

export class Searchable {

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
        break;
      case 'AREA':
        searchable.area = Area.deserialize(payload.item);
        break;
      case 'SECTOR':
        searchable.sector = Sector.deserialize(payload.item);
        break;
      case 'CRAG':
        searchable.crag = Crag.deserialize(payload.item);
        break;
      case 'USER':
        searchable.user = User.deserialize(payload.item);
        break;
    }
    return searchable;
  }

}
