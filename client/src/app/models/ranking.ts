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
  top10Exponential: number;
  top25: number;
  top25Exponential: number;
  top10Fa: number;
  top10FaExponential: number;
  total: number;
  totalCount: number;
  totalExponential: number;
  totalFa: number;
  totalFaCount: number;
  totalFaExponential: number;
  user: User;

  // Helpers for easier template usage
  routerLinkUser: string;

  public static deserialize(payload: any): Ranking {
    const ranking = new Ranking();
    ranking.top10 = payload.top10;
    ranking.top10Exponential = payload.top10Exponential;
    ranking.top25 = payload.top25;
    ranking.top25Exponential = payload.top25Exponential;
    ranking.top10Fa = payload.top10Fa;
    ranking.top10FaExponential = payload.top10FaExponential;
    ranking.total = payload.total;
    ranking.totalCount = payload.totalCount;
    ranking.totalExponential = payload.totalExponential;
    ranking.totalFa = payload.totalFa;
    ranking.totalFaCount = payload.totalFaCount;
    ranking.totalFaExponential = payload.totalFaExponential;
    ranking.user = User.deserialize(payload.user);

    ranking.routerLinkUser = `/users/${ranking.user.slug}`;

    return ranking;
  }

}
