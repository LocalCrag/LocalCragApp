import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ReleaseNotesService } from '../../../services/crud/release-notes.service';
import {
  ReleaseNoteBundleItem,
  ReleaseNoteBundlePayload,
} from '../../../models/release-note-bundle';
import { releaseNoteBundleItemsInDisplayOrder } from '../../../utility/release-note-bundle-sections';
import { Store } from '@ngrx/store';
import { AppState } from '../../../ngrx/reducers';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { EMPTY, of } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  map,
  switchMap,
  take,
} from 'rxjs/operators';

/** Loads manifest-synced `marker()` keys for transloco-keys-manager extract. */
import '../../../utility/release-note-transloco-keys';

@Component({
  selector: 'lc-release-notes-bundle',
  imports: [TranslocoDirective, CardModule, MessageModule],
  templateUrl: './release-notes-bundle.component.html',
  styleUrl: './release-notes-bundle.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ReleaseNotesBundleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private releaseNotesService = inject(ReleaseNotesService);
  private transloco = inject(TranslocoService);
  private title = inject(Title);
  private store = inject<Store<AppState>>(Store);

  bundle: ReleaseNoteBundlePayload | null = null;
  loadError = false;

  get bundleItems(): ReleaseNoteBundleItem[] {
    return releaseNoteBundleItemsInDisplayOrder(this.bundle);
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((pm) => pm.get('bundleId')),
        distinctUntilChanged(),
        switchMap((id) => {
          if (!id) {
            this.bundle = null;
            this.loadError = true;
            return EMPTY;
          }
          this.bundle = null;
          this.loadError = false;
          return this.releaseNotesService.getBundle(id).pipe(
            catchError(() => {
              this.loadError = true;
              this.bundle = null;
              return of(undefined);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((b) => {
        if (b === undefined) {
          return;
        }
        this.bundle = b;
        this.loadError = false;
        this.store
          .select(selectInstanceName)
          .pipe(take(1))
          .subscribe((instanceName) => {
            this.title.setTitle(
              `${this.transloco.translate(marker('releaseNotes.browserTitle'))} - ${instanceName}`,
            );
          });
      });
  }
}
