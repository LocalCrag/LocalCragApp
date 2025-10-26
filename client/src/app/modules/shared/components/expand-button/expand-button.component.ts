import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'lc-expand-button',
  imports: [ButtonModule],
  templateUrl: './expand-button.component.html',
  styleUrl: './expand-button.component.scss',
})
export class ExpandButtonComponent {
  @Input() expanded: boolean = false;
  @Output() expandedChange = new EventEmitter<boolean>();
}
