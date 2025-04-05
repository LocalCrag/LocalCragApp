import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { NgIf } from '@angular/common';

@Component({
  selector: 'lc-expand-button',
  imports: [ButtonModule, NgIf],
  templateUrl: './expand-button.component.html',
  styleUrl: './expand-button.component.scss',
})
export class ExpandButtonComponent {
  @Input() expanded: boolean = false;
  @Output() expandedChange = new EventEmitter<boolean>();
}
