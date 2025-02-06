import {
  Component,
  HostBinding,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { Searchable } from '../../../models/searchable';
import { AvatarModule } from 'primeng/avatar';
import { AsyncPipe, NgIf } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ScalesService } from '../../../services/crud/scales.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'lc-searchable',
  standalone: true,
  imports: [
    AvatarModule,
    NgIf,
    TranslocoDirective,
    RouterLink,
    AsyncPipe,
    SharedModule,
  ],
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
  protected readonly environment = environment;

  constructor(protected scalesService: ScalesService) {}
}
