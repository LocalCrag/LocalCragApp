import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideLoader2,
  lucideMapPin,
  lucideSearch,
} from '@ng-icons/lucide';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { Coordinates } from '../../../../interfaces/coordinates.interface';
import { GeocodingService } from '../../../../services/core/geocoding.service';
import {
  CondicasterCragHit,
  CondicasterService,
} from '../../../../services/crud/condicaster.service';
import { GeocodePlace } from '../../../../utility/geo/geocode-places';
import { parseCoordinatesInput } from '../../../../utility/geo/parse-coordinates';

@Component({
  selector: 'lc-condicaster-crag-search',
  templateUrl: './condicaster-crag-search.component.html',
  styleUrl: './condicaster-crag-search.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideLoader2,
      lucideMapPin,
      lucideSearch,
    }),
  ],
  imports: [
    FormsModule,
    TranslocoDirective,
    HlmButton,
    HlmInputGroupImports,
    HlmSeparator,
    NgIcon,
  ],
})
export class CondicasterCragSearchComponent implements AfterViewInit {
  @ViewChild('queryInput') private queryInput?: ElementRef<HTMLInputElement>;

  protected query = '';
  protected places: GeocodePlace[] = [];
  protected crags: CondicasterCragHit[] = [];
  protected searchingPlaces = false;
  protected searchingCrags = false;
  protected errorKey = '';
  protected searchedLabel = '';
  protected step: 'place' | 'crags' = 'place';
  private searchGeneration = 0;

  private context = injectBrnDialogContext<{
    coordinates: Coordinates | null;
  }>();
  private dialogRef = inject(BrnDialogRef);
  private changeDetector = inject(ChangeDetectorRef);
  private geocoding = inject(GeocodingService);
  private condicaster = inject(CondicasterService);
  private transloco = inject(TranslocoService);
  private destroyRef = inject(DestroyRef);
  private queryUpdate = new Subject<string>();

  constructor() {
    this.queryUpdate
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        tap((query) => {
          if (!query.trim() || parseCoordinatesInput(query)) {
            this.searchingPlaces = false;
            this.places = [];
          }
        }),
        switchMap((query) => {
          const generation = ++this.searchGeneration;
          const trimmed = query.trim();
          if (
            this.step !== 'place' ||
            !trimmed ||
            parseCoordinatesInput(trimmed)
          ) {
            return of({
              generation,
              places: [] as GeocodePlace[],
              failed: false,
              skipped: true,
            });
          }
          this.searchingPlaces = true;
          this.places = [];
          this.errorKey = '';
          return this.geocoding
            .search(trimmed, {
              limit: 6,
              language: this.transloco.getActiveLang(),
            })
            .pipe(
              map((places) => ({
                generation,
                places,
                failed: false,
                skipped: false,
              })),
              catchError(() =>
                of({
                  generation,
                  places: [] as GeocodePlace[],
                  failed: true,
                  skipped: false,
                }),
              ),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (
          result.generation !== this.searchGeneration ||
          this.step !== 'place'
        ) {
          return;
        }
        this.searchingPlaces = false;
        if (!result.skipped) {
          this.places = result.places;
          this.errorKey = result.failed
            ? 'condicaster.search.placeFailed'
            : result.places.length === 0
              ? 'condicaster.search.noPlaces'
              : '';
        }
        this.changeDetector.markForCheck();
      });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.queryInput?.nativeElement.focus());
  }

  protected spotCoordinates(): Coordinates | null {
    return this.context.coordinates ?? null;
  }

  protected onQueryChange(value: string): void {
    this.query = value;
    this.errorKey = '';
    const trimmed = value.trim();
    const willSearch = trimmed.length > 0 && !parseCoordinatesInput(trimmed);
    this.searchingPlaces = willSearch;
    if (!willSearch) {
      this.places = [];
    }
    this.queryUpdate.next(value);
  }

  protected coordinatesFromQuery(): Coordinates | null {
    return parseCoordinatesInput(this.query);
  }

  protected searchAtFromQuery(coordinates: Coordinates): void {
    this.searchAt(coordinates, this.query.trim());
  }

  protected submit(): void {
    if (this.step !== 'place' || this.searchingPlaces) {
      return;
    }
    const parsed = parseCoordinatesInput(this.query);
    if (parsed) {
      this.searchAtFromQuery(parsed);
      return;
    }
    if (this.places.length > 0) {
      this.selectPlace(this.places[0]);
    }
  }

  protected searchNearSpot(): void {
    const spot = this.spotCoordinates();
    if (!spot) {
      return;
    }
    this.searchAt(spot, `${spot.lat}, ${spot.lng}`);
  }

  protected back(): void {
    this.searchGeneration++;
    this.step = 'place';
    this.crags = [];
    this.searchingCrags = false;
    this.errorKey = '';
    setTimeout(() => this.queryInput?.nativeElement.focus());
  }

  protected selectPlace(place: GeocodePlace): void {
    this.searchAt(place.coordinates, place.label);
  }

  protected selectCrag(crag: CondicasterCragHit): void {
    this.dialogRef.close(crag);
  }

  private searchAt(coordinates: Coordinates, label: string): void {
    const generation = ++this.searchGeneration;
    this.step = 'crags';
    this.searchingCrags = true;
    this.errorKey = '';
    this.crags = [];
    this.searchedLabel = label;
    this.condicaster
      .searchCrags(coordinates.lat, coordinates.lng)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (crags) => {
          if (generation !== this.searchGeneration) {
            return;
          }
          this.searchingCrags = false;
          this.crags = crags;
          if (crags.length === 0) {
            this.errorKey = 'condicaster.search.noCrags';
          }
          this.changeDetector.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          if (generation !== this.searchGeneration) {
            return;
          }
          this.searchingCrags = false;
          this.errorKey =
            error.status === 429
              ? 'condicaster.search.rateLimited'
              : 'condicaster.search.failed';
          this.changeDetector.markForCheck();
        },
      });
  }
}
