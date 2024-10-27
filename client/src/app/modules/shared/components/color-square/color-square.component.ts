import {Component, Input} from '@angular/core';
import { ChipModule } from 'primeng/chip';
import { TranslocoDirective } from '@jsverse/transloco';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'lc-color-square',
  standalone: true,
  templateUrl: './color-square.component.html',
  styleUrl: './color-square.component.scss',
})
export class ColorSquareComponent {
  @Input() color: string;
}
