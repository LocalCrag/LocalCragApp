import { Component, Input } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'lc-closed-spot-alert',
  imports: [MessageModule, TranslocoDirective],
  templateUrl: './closed-spot-alert.component.html',
  styleUrl: './closed-spot-alert.component.scss',
})
export class ClosedSpotAlertComponent {
  @Input() reason: string;
}
