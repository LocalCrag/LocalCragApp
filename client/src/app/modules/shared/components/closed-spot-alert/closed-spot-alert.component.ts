import { Component, Input } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgIf } from '@angular/common';

@Component({
  selector: 'lc-closed-spot-alert',
  imports: [MessageModule, TranslocoDirective, NgIf],
  templateUrl: './closed-spot-alert.component.html',
  styleUrl: './closed-spot-alert.component.scss',
})
export class ClosedSpotAlertComponent {
  @Input() reason: string;
}
