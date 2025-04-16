import { Component, Input } from '@angular/core';

@Component({
  selector: 'lc-color-square',
  templateUrl: './color-square.component.html',
  styleUrl: './color-square.component.scss',
})
export class ColorSquareComponent {
  @Input({ required: true }) color: string;
  @Input() transparent = false;
}
