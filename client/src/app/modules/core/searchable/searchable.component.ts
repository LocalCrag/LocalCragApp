import {
  Component,
  HostBinding,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { Searchable } from '../../../models/searchable';
import { AvatarModule } from 'primeng/avatar';
import { NgIf } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'lc-searchable',
  standalone: true,
  imports: [AvatarModule, NgIf, TranslocoDirective, RouterLink],
  templateUrl: './searchable.component.html',
  styleUrl: './searchable.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class SearchableComponent {
  @Input() searchable: Searchable;
  /**
   * Set to true if searchable is displayed in a small container. Will apply ellipsis to texts and force a single line.
   */
  @HostBinding('class.ellipsis')
  @Input()
  ellipsis = false;
}
