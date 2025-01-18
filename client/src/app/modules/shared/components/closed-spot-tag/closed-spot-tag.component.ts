import { Component } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'lc-closed-spot-tag',
  standalone: true,
  imports: [TagModule, TranslocoDirective],
  templateUrl: './closed-spot-tag.component.html',
  styleUrl: './closed-spot-tag.component.scss',
})
export class ClosedSpotTagComponent {}
