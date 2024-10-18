import {Component} from '@angular/core';
import {BreadcrumbModule} from 'primeng/breadcrumb';
import {CardModule} from 'primeng/card';
import {NgIf} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {TabMenuModule} from 'primeng/tabmenu';
import {TranslocoDirective} from '@jsverse/transloco';

@Component({
  selector: 'lc-ascents',
  standalone: true,
  imports: [
    BreadcrumbModule,
    CardModule,
    NgIf,
    RouterOutlet,
    TabMenuModule,
    TranslocoDirective,
  ],
  templateUrl: './ascents.component.html',
  styleUrl: './ascents.component.scss',
})
export class AscentsComponent {}
