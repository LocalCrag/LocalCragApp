import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ReleaseNotesService } from '../../../services/crud/release-notes.service';
import {
  ReleaseNoteBundleItem,
  ReleaseNoteBundlePayload,
  ReleaseNoteItemType,
  RELEASE_NOTE_ITEM_TYPE_DISPLAY_ORDER,
} from '../../../models/release-note-bundle';
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

  /** One block per item type present in the bundle (FEATURE, then FIX). */
  get bundleSections(): {
    type: ReleaseNoteItemType;
    items: ReleaseNoteBundleItem[];
  }[] {
    if (!this.bundle?.items?.length) {
      return [];
    }
    const byType = new Map<ReleaseNoteItemType, ReleaseNoteBundleItem[]>();
    for (const item of this.bundle.items) {
      if (!byType.has(item.type)) {
        byType.set(item.type, []);
      }
      byType.get(item.type)!.push(item);
    }
    const sections: {
      type: ReleaseNoteItemType;
      items: ReleaseNoteBundleItem[];
    }[] = [];
    for (const type of RELEASE_NOTE_ITEM_TYPE_DISPLAY_ORDER) {
      const items = byType.get(type);
      if (items?.length) {
        sections.push({ type, items });
      }
    }
    return sections;
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
