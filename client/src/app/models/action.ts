import * as moment from 'moment';
import {ActionState} from './action-state';

export class Action {
  name: string;
  description: string;
  start: moment.Moment;
  end: moment.Moment;
  state: ActionState;
  category: string;

  constructor(name: string, start: moment.Moment, end: moment.Moment, state: ActionState, category: string) {
    this.name = name;
    this.start = start;
    this.end = end;
    this.state = state;
    this.category = category;
  }

}
