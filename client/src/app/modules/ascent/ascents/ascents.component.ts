import { Component } from '@angular/core';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CardModule } from 'primeng/card';
import { RouterOutlet } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'lc-ascents',
  standalone: true,
  imports: [BreadcrumbModule, CardModule, RouterOutlet, TranslocoDirective],
  templateUrl: './ascents.component.html',
  styleUrl: './ascents.component.scss',
})
export class AscentsComponent {}
