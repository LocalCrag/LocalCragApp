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
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';
import { Store } from '@ngrx/store';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'lc-searchable',
  imports: [
    AvatarModule,
    NgIf,
    TranslocoDirective,
    RouterLink,
    LineGradePipe,
    AsyncPipe,
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

  constructor(
    protected scalesService: ScalesService,
    private store: Store,
  ) {}

  public lineGradeValue() {
    if (!this.searchable.line) return of(undefined);
    return this.store
      .select(selectInstanceSettingsState)
      .pipe(
        map((state) =>
          state.displayUserGrades
            ? this.searchable.line.userGradeValue
            : this.searchable.line.authorGradeValue,
        ),
      );
  }
}
