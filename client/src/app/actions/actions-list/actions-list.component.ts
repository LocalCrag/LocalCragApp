import { Component, OnInit } from '@angular/core';
import {Action} from '../../models/action';
import * as moment from 'moment';
import {ActionState} from '../../models/action-state';

@Component({
  selector: 'app-actions-list',
  templateUrl: './actions-list.component.html',
  styleUrls: ['./actions-list.component.scss']
})
export class ActionsListComponent implements OnInit {

  actions: Action[] = [];

  sortOptions: any[];

  sortOrder: number;

  sortField: string;

  sortKey: string;


  ngOnInit() {

    const stateNotStarted = new ActionState('Ausstehend', 'yellow')
    const stateFinished = new ActionState('Beendet', 'green')
    const stateCancelled = new ActionState('Abgesagt', 'red')

    this.actions.push(new Action('FFF Demo', moment(), moment(), stateFinished, 'Demos'));
    this.actions.push(new Action('No parking Weekend', moment(), moment(), stateFinished, 'GP-KO-Aktion'));
    this.actions.push(new Action('Nachplenumsbesäufnis', moment(), moment(), stateNotStarted, 'Anderes'));
    this.actions.push(new Action('Stickern gehen', moment(), moment(), stateCancelled, 'GP-KO-Aktion'));
    this.actions.push(new Action('Klima retten', moment(), moment(), stateNotStarted, 'GP-KO-Aktion'));

    this.sortOptions = [
      {label: 'Price High to Low', value: '!price'},
      {label: 'Price Low to High', value: 'price'}
    ];
  }

  onSortChange(event: any) {
    let value = event.value;

    if (value.indexOf('!') === 0) {
      this.sortOrder = -1;
      this.sortField = value.substring(1, value.length);
    }
    else {
      this.sortOrder = 1;
      this.sortField = value;
    }
  }

}
