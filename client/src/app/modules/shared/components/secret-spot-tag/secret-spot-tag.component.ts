import {Component} from '@angular/core';
import {ChipModule} from 'primeng/chip';
import {TranslocoDirective} from '@jsverse/transloco';
import {TagModule} from 'primeng/tag';

@Component({
  selector: 'lc-secret-spot-tag',
  standalone: true,
  imports: [ChipModule, TranslocoDirective, TagModule],
  templateUrl: './secret-spot-tag.component.html',
  styleUrl: './secret-spot-tag.component.scss',
})
export class SecretSpotTagComponent {}
