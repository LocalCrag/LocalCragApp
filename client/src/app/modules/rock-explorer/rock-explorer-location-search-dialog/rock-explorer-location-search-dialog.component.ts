import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { GeocodingService } from '../../../services/core/geocoding.service';
import { GeocodePlace } from '../../../utility/geo/geocode-places';
import { parseCoordinatesInput } from '../../../utility/geo/parse-coordinates';
import { RockExplorerUiService } from '../rock-explorer-ui.service';

@Component({
  selector: 'lc-rock-explorer-location-search-dialog',
  imports: [
    FormsModule,
    TranslocoDirective,
    ButtonModule,
    InputTextModule,
    InputGroup,
    InputGroupAddon,
    MessageModule,
  ],
  templateUrl: './rock-explorer-location-search-dialog.component.html',
  styleUrl: './rock-explorer-location-search-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class RockExplorerLocationSearchDialogComponent implements AfterViewInit {
  @ViewChild('queryInput') private queryInput?: ElementRef<HTMLInputElement>;

  query = '';
  errorMessage = '';
  loading = false;
  places: GeocodePlace[] = [];

  private ref = inject(DynamicDialogRef);
  private transloco = inject(TranslocoService);
  private ui = inject(RockExplorerUiService);
  private geocoding = inject(GeocodingService);
  private destroyRef = inject(DestroyRef);
  private queryUpdate = new Subject<string>();

  constructor() {
    this.queryUpdate
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        tap((query) => {
          this.errorMessage = '';
          if (!query.trim() || parseCoordinatesInput(query)) {
            this.loading = false;
            this.places = [];
          }
        }),
        switchMap((query) => {
          const trimmed = query.trim();
          if (!trimmed || parseCoordinatesInput(trimmed)) {
            return of([] as GeocodePlace[]);
          }
          this.loading = true;
          return this.geocoding
            .search(trimmed, {
              limit: 6,
              language: this.transloco.getActiveLang(),
            })
            .pipe(
              catchError(() => {
                this.errorMessage = this.transloco.translate(
                  marker('rockExplorer.locationSearchFailed'),
                );
                return of([] as GeocodePlace[]);
              }),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((places) => {
        this.loading = false;
        this.places = places;
      });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.queryInput?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape', ['$event'])
  onDocumentEscape(event: Event): void {
    event.preventDefault();
    this.close();
  }

  onQueryChange(value: string): void {
    this.query = value;
    this.errorMessage = '';
    this.queryUpdate.next(value);
  }

  submit(): void {
    const parsed = parseCoordinatesInput(this.query);
    if (parsed) {
      this.goTo(parsed);
      return;
    }
    if (this.loading) {
      return;
    }
    if (this.places.length > 0) {
      this.selectPlace(this.places[0]);
      return;
    }
    const trimmed = this.query.trim();
    if (!trimmed) {
      return;
    }
    this.loading = true;
    this.geocoding
      .search(trimmed, {
        limit: 6,
        language: this.transloco.getActiveLang(),
      })
      .pipe(
        take(1),
        catchError(() => {
          this.errorMessage = this.transloco.translate(
            marker('rockExplorer.locationSearchFailed'),
          );
          return of([] as GeocodePlace[]);
        }),
      )
      .subscribe((places) => {
        this.loading = false;
        this.places = places;
        if (places.length > 0) {
          this.selectPlace(places[0]);
          return;
        }
        if (!this.errorMessage) {
          this.errorMessage = this.transloco.translate(
            marker('rockExplorer.locationSearchNoResults'),
          );
        }
      });
  }

  selectPlace(place: GeocodePlace): void {
    this.goTo(place.coordinates);
  }

  close(): void {
    this.ref.close();
  }

  private goTo(coordinates: { lat: number; lng: number }): void {
    this.ui.dispatch({
      type: 'focusCoordinates',
      coordinates,
      transientMarker: true,
    });
    this.close();
  }
}
