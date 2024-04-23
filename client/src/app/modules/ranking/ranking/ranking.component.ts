import { Component } from '@angular/core';
import {CardModule} from 'primeng/card';
import {RouterOutlet} from '@angular/router';
import {TranslocoDirective} from '@ngneat/transloco';

@Component({
  selector: 'lc-ranking',
  standalone: true,
  imports: [
    CardModule,
    RouterOutlet,
    TranslocoDirective
  ],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.scss'
})
export class RankingComponent {

}
