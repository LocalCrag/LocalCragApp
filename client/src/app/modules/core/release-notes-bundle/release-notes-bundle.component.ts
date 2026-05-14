import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ReleaseNotesService } from '../../../services/crud/release-notes.service';
import { ReleaseNoteBundlePayload } from '../../../models/release-note-bundle';
import {
  releaseNoteBundleSections,
  type ReleaseNoteBundleSection,
} from '../../../utility/release-note-bundle-sections';
import { Store } from '@ngrx/store';
import { AppState } from '../../../ngrx/reducers';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { take } from 'rxjs/operators';

/** Loads manifest-synced `marker()` keys for transloco-keys-manager extract. */
import '../../../utility/release-note-transloco-keys';

@Component({
  selector: 'lc-release-notes-bundle',
  imports: [
    TranslocoDirective,
    CardModule,
    ButtonModule,
    MessageModule,
    RouterLink,
  ],
  templateUrl: './release-notes-bundle.component.html',
  styleUrl: './release-notes-bundle.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ReleaseNotesBundleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private releaseNotesService = inject(ReleaseNotesService);
  private transloco = inject(TranslocoService);
  private title = inject(Title);
  private store = inject<Store<AppState>>(Store);

  bundle: ReleaseNoteBundlePayload | null = null;
  loadError = false;

  get bundleSections(): ReleaseNoteBundleSection[] {
    return releaseNoteBundleSections(this.bundle);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('bundleId');
    if (!id) {
      this.loadError = true;
      return;
    }
    this.releaseNotesService.getBundle(id).subscribe({
      next: (b) => {
        this.bundle = b;
        this.store
          .select(selectInstanceName)
          .pipe(take(1))
          .subscribe((instanceName) => {
            this.title.setTitle(
              `${this.transloco.translate(marker('releaseNotes.browserTitle'))} - ${instanceName}`,
            );
          });
      },
      error: () => {
        this.loadError = true;
      },
    });
  }
}
