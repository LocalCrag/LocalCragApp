import {
  Component,
  Input,
  ViewChild,
  ViewEncapsulation,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHammer, lucideUndo2 } from '@ng-icons/lucide';
import {
  HlmAlertDialog,
  HlmAlertDialogImports,
} from '@spartan-ng/helm/alert-dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { Store } from '@ngrx/store';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { Line } from '../../../models/line';
import { Crag } from '../../../models/crag';
import { Sector } from '../../../models/sector';
import { Area } from '../../../models/area';
import { TopoImage } from '../../../models/topo-image';
import { ArchiveService } from '../../../services/crud/archive.service';
import { GymModeDirective } from '../../shared/directives/gym-mode.directive';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Observable } from 'rxjs';

@Component({
  selector: 'lc-archive-button',
  imports: [
    ...HlmAlertDialogImports,
    HlmButton,
    NgClass,
    NgIcon,
    TranslocoDirective,
    GymModeDirective,
  ],
  providers: [provideIcons({ lucideHammer, lucideUndo2 })],
  templateUrl: './archive-button.component.html',
  styleUrl: './archive-button.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class ArchiveButtonComponent {
  @Input() line?: Line;
  @Input() topoImage?: TopoImage;
  @Input() area?: Area;
  @Input() sector?: Sector;
  @Input() crag?: Crag;
  @Input() showLabel: boolean;
  @Input() style: 'plain' | 'outline' | 'rounded' = 'plain';

  @ViewChild('archiveDialog') archiveDialog?: HlmAlertDialog;

  public confirmMessage = '';
  public acceptLabel = '';
  public rejectLabel = '';
  private confirmMode: 'entity' | 'topo' | null = null;
  private confirmEntityType: 'area' | 'sector' | 'crag' | null = null;

  private archiveService = inject(ArchiveService);
  private translocoService = inject(TranslocoService);
  private store = inject(Store);

  getCurrentState() {
    if (this.line) return this.line.publicationStatus === 'archived';
    if (this.topoImage) return this.topoImage.publicationStatus === 'archived';
    if (this.area) return this.area.publicationStatus === 'archived';
    if (this.sector) return this.sector.publicationStatus === 'archived';
    if (this.crag) return this.crag.publicationStatus === 'archived';
    return false;
  }

  private publicationStatus(): string {
    return (
      this.line?.publicationStatus ??
      this.topoImage?.publicationStatus ??
      this.area?.publicationStatus ??
      this.sector?.publicationStatus ??
      this.crag?.publicationStatus ??
      'published'
    );
  }

  private applyStatus(status: string) {
    if (this.line) this.line.publicationStatus = status;
    if (this.topoImage) this.topoImage.publicationStatus = status;
    if (this.area) this.area.publicationStatus = status;
    if (this.sector) this.sector.publicationStatus = status;
    if (this.crag) this.crag.publicationStatus = status;
  }

  private setArchived(archived: boolean) {
    this.applyStatus(archived ? 'archived' : 'published');
  }

  /**
   * Flip the local status immediately, then put it back if the request fails.
   * The toast uses the attempted change, not the restored status.
   */
  private subscribeArchive(
    request: Observable<unknown>,
    nextArchived: boolean,
    previous: string,
  ) {
    request.subscribe({
      next: () => {
        this.store.dispatch(
          toastNotification(nextArchived ? 'ARCHIVED' : 'UNARCHIVED'),
        );
      },
      error: () => {
        this.applyStatus(previous);
        this.store.dispatch(
          toastNotification(
            nextArchived ? 'ARCHIVED_ERROR' : 'UNARCHIVED_ERROR',
          ),
        );
      },
    });
  }

  toggleArchived(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (this.line) {
      const previous = this.publicationStatus();
      const nextArchived = !this.getCurrentState();
      this.setArchived(nextArchived);
      this.subscribeArchive(
        this.archiveService.changeLineArchived(this.line),
        nextArchived,
        previous,
      );
    }

    if (this.topoImage) {
      this.confirmArchiveTopoImage(event);
    }

    if (this.area || this.sector || this.crag) {
      if (this.getCurrentState()) {
        this.restoreArchivedEntity();
        return;
      }
      this.confirmArchiveEntity(
        event,
        this.area ? 'area' : this.sector ? 'sector' : 'crag',
      );
    }
  }

  confirmArchiveEntity(_event: Event, type: 'area' | 'sector' | 'crag') {
    const messageKeys = {
      area: marker('archive.askConfirmArchiveArea'),
      sector: marker('archive.askConfirmArchiveSector'),
      crag: marker('archive.askConfirmArchiveCrag'),
    };

    this.openConfirm(
      'entity',
      this.translocoService.translate(messageKeys[type]),
      this.translocoService.translate(marker('archive.yesArchive')),
      this.translocoService.translate(marker('archive.noCancel')),
      type,
    );
  }

  doArchiveEntity(type: 'area' | 'sector' | 'crag') {
    const previous = this.publicationStatus();
    this.setArchived(true);
    const archiveRequest =
      type === 'area'
        ? this.archiveService.setAreaArchived(this.area)
        : type === 'sector'
          ? this.archiveService.setSectorArchived(this.sector)
          : this.archiveService.setCragArchived(this.crag);

    this.subscribeArchive(archiveRequest, true, previous);
  }

  restoreArchivedEntity() {
    const previous = this.publicationStatus();
    this.setArchived(false);
    const archiveRequest = this.area
      ? this.archiveService.restoreArea(this.area)
      : this.sector
        ? this.archiveService.restoreSector(this.sector)
        : this.archiveService.restoreCrag(this.crag);
    this.subscribeArchive(archiveRequest, false, previous);
  }

  confirmArchiveTopoImage(_event: Event) {
    this.openConfirm(
      'topo',
      this.translocoService.translate(
        this.topoImage.publicationStatus === 'archived'
          ? marker('archive.askAlsoUnArchiveLines')
          : marker('archive.askAlsoArchiveLines'),
      ),
      this.translocoService.translate(marker('archive.yesWithLines')),
      this.translocoService.translate(marker('archive.noWithoutLines')),
    );
  }

  acceptConfirm(): void {
    if (this.confirmMode === 'entity' && this.confirmEntityType) {
      this.doArchiveEntity(this.confirmEntityType);
    }
    if (this.confirmMode === 'topo') {
      this.doArchiveTopoImage(true);
    }
    this.archiveDialog?.close();
  }

  rejectConfirm(): void {
    if (this.confirmMode === 'topo') {
      this.doArchiveTopoImage(false);
    }
    this.archiveDialog?.close();
  }

  private openConfirm(
    mode: 'entity' | 'topo',
    message: string,
    acceptLabel: string,
    rejectLabel: string,
    entityType: 'area' | 'sector' | 'crag' | null = null,
  ): void {
    this.confirmMode = mode;
    this.confirmEntityType = entityType;
    this.confirmMessage = message;
    this.acceptLabel = acceptLabel;
    this.rejectLabel = rejectLabel;
    this.archiveDialog?.open();
  }

  doArchiveTopoImage(cascadeToLines: boolean) {
    const previous = this.publicationStatus();
    const nextArchived = this.topoImage.publicationStatus !== 'archived';
    this.setArchived(nextArchived);
    this.subscribeArchive(
      this.archiveService.changeTopoImageArchived(
        this.topoImage,
        cascadeToLines,
      ),
      nextArchived,
      previous,
    );
  }
}
