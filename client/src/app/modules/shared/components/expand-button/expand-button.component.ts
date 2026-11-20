import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideChevronUp } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'lc-expand-button',
  imports: [HlmButton, NgIcon],
  providers: [provideIcons({ lucideChevronDown, lucideChevronUp })],
  templateUrl: './expand-button.component.html',
  styleUrl: './expand-button.component.scss',
})
export class ExpandButtonComponent {
  @Input() expanded: boolean = false;
  @Output() expandedChange = new EventEmitter<boolean>();
}
