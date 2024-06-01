import {AbstractModel} from './abstract-model';
import {File} from './file';
import {GPS} from '../interfaces/gps.interface';
import {deserializeGrade, Grade} from '../utility/misc/grades';
import {Line} from './line';
import {format, formatISO, parseISO} from 'date-fns';
import {User} from './user';
import {Area} from './area';
import {Sector} from './sector';
import {Crag} from './crag';
import {A} from '@angular/cdk/keycodes';

export class Ranking {

  top10: number;
  top50: number;
  totalCount: number;
  user: User;

  // Helpers for easier template usage
  routerLinkUser: string;

  public static deserialize(payload: any): Ranking {
    const ranking = new Ranking();
    ranking.top10 = payload.top10;
    ranking.top50 = payload.top50;
    ranking.totalCount = payload.totalCount;
    ranking.user = User.deserialize(payload.user);

    ranking.routerLinkUser = `/users/${ranking.user.slug}`;

    return ranking;
  }

}
