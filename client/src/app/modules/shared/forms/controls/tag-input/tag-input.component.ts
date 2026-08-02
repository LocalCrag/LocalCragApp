import {
  Component,
  DestroyRef,
  forwardRef,
  inject,
  Input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { Searchable } from '../../../../../models/searchable';
import { SearchService } from '../../../../../services/crud/search.service';
import { SearchableComponent } from '../../../../core/searchable/searchable.component';

export type TagInputObjectKind = 'line' | 'area' | 'sector' | 'crag' | 'user';

/**
 * Multi-select searchable typeahead used for gallery tags and rock-explorer topo links.
 * Value is Searchable[]; parents map to Tag[] when persisting.
 */
@Component({
  selector: 'lc-tag-input',
  standalone: true,
  imports: [FormsModule, AutoComplete, SearchableComponent],
  templateUrl: './tag-input.component.html',
  styleUrl: './tag-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagInputComponent),
      multi: true,
    },
  ],
})
export class TagInputComponent implements ControlValueAccessor {
  /** Restrict suggestions to these kinds. Empty = allow all searchable types. */
  @Input() allowedKinds: TagInputObjectKind[] = [];
  @Input() placeholder = '';

  public value: Searchable[] = [];
  public suggestions: Searchable[] = [];
  public disabled = false;

  private destroyRef = inject(DestroyRef);
  private searchService = inject(SearchService);
  private onChange: (value: Searchable[]) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: Searchable[] | null): void {
    this.value = value ?? [];
  }

  registerOnChange(fn: (value: Searchable[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onValueChange(value: Searchable[]): void {
    this.value = value ?? [];
    this.onChange(this.value);
    this.onTouched();
  }

  loadSuggestions(event: AutoCompleteCompleteEvent): void {
    this.searchService
      .search(event.query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((results) => {
        this.suggestions = results.filter((item) => this.isAllowed(item));
      });
  }

  private isAllowed(item: Searchable): boolean {
    if (this.allowedKinds.length === 0) {
      return true;
    }
    return this.allowedKinds.some((kind) => !!item[kind]);
  }
}
