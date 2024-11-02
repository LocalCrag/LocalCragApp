import {Component, Input} from '@angular/core';

@Component({
  selector: 'lc-color-square',
  standalone: true,
  templateUrl: './color-square.component.html',
  styleUrl: './color-square.component.scss',
})
export class ColorSquareComponent {
  @Input({ required: true }) color: string;
  @Input() transparent = false;
}
