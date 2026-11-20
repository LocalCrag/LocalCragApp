import {
  AfterViewInit,
  Component,
  DestroyRef,
  effect,
  Injector,
  Input,
  runInInjectionContext,
  ViewChild,
  ViewEncapsulation,
  forwardRef,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BrnComboboxMultiple } from '@spartan-ng/brain/combobox';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { catchError, map, of, Subject, switchMap } from 'rxjs';
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
  imports: [...HlmComboboxImports, SearchableComponent],
  templateUrl: './tag-input.component.html',
  styleUrl: './tag-input.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagInputComponent),
      multi: true,
    },
  ],
})
export class TagInputComponent implements ControlValueAccessor, AfterViewInit {
  /** Restrict suggestions to these kinds. Empty = allow all searchable types. */
  @Input() allowedKinds: TagInputObjectKind[] = [];
  @Input() placeholder = '';

  @ViewChild('combo') private combo?: BrnComboboxMultiple<Searchable>;

  public value: Searchable[] = [];
  public suggestions: Searchable[] = [];
  public disabled = false;

  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);
  private searchService = inject(SearchService);
  private queries = new Subject<string>();
  private onChange: (value: Searchable[]) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    // Clicking the chips opens the panel even when the query is empty.
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const combo = this.combo;
        if (!combo?.isExpanded()) {
          return;
        }
        const query = combo.search().trim();
        if (query || this.suggestions.length > 0) {
          return;
        }
        queueMicrotask(() => {
          if (!this.combo?.search().trim() && this.suggestions.length === 0) {
            this.combo?.close();
          }
        });
      });
    });
  }

  constructor() {
    this.queries
      .pipe(
        switchMap((query) => {
          const trimmed = query.trim();
          if (!trimmed) {
            return of([] as Searchable[]);
          }
          return this.searchService.search(trimmed).pipe(
            map((results) => results.filter((item) => this.isAllowed(item))),
            catchError(() => of([] as Searchable[])),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((suggestions) => {
        this.suggestions = suggestions;
        this.syncPanel();
      });
  }

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

  searchableLabel = (item: Searchable | null): string => item?.name ?? '';

  sameSearchable = (a: Searchable, b: Searchable): boolean => a?.id === b?.id;

  showSuggestion = (): boolean => true;

  loadSuggestions(query: string): void {
    const trimmed = query?.trim() ?? '';
    if (!trimmed) {
      this.suggestions = [];
      this.syncPanel();
    }
    this.queries.next(query ?? '');
  }

  /**
   * Show the list only when there are matches.
   * Closing the panel also clears the query, so an empty result set is hidden
   * in CSS instead of closed while the user is still typing.
   */
  private syncPanel(): void {
    queueMicrotask(() => {
      const combo = this.combo;
      if (!combo) {
        return;
      }
      if (this.suggestions.length > 0) {
        combo.open();
        requestAnimationFrame(() => combo['_brnPopover']?.updatePosition());
        return;
      }
      if (!combo.search()) {
        combo.close();
      }
    });
  }

  private isAllowed(item: Searchable): boolean {
    if (this.allowedKinds.length === 0) {
      return true;
    }
    return this.allowedKinds.some((kind) => !!item[kind]);
  }
}
