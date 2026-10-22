import { Component, Input, ViewEncapsulation, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { NgClass } from '@angular/common';
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
import { ConfirmationService } from 'primeng/api';
import { ConfirmPopup } from 'primeng/confirmpopup';

@Component({
  selector: 'lc-archive-button',
  imports: [
    ButtonModule,
    NgClass,
    TranslocoDirective,
    GymModeDirective,
    ConfirmPopup,
  ],
  providers: [ConfirmationService],
  templateUrl: './archive-button.component.html',
  styleUrl: './archive-button.component.scss',
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

  private archiveService = inject(ArchiveService);
  private confirmationService = inject(ConfirmationService);
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

  private setArchived(archived: boolean) {
    const status = archived ? 'archived' : 'published';
    if (this.line) this.line.publicationStatus = status;
    if (this.topoImage) this.topoImage.publicationStatus = status;
    if (this.area) this.area.publicationStatus = status;
    if (this.sector) this.sector.publicationStatus = status;
    if (this.crag) this.crag.publicationStatus = status;
  }

  toggleArchivedResultHandler = {
    next: (_) => {
      this.store.dispatch(
        toastNotification(this.getCurrentState() ? 'ARCHIVED' : 'UNARCHIVED'),
      );
    },
    error: () => {
      this.store.dispatch(
        toastNotification(
          this.getCurrentState() ? 'ARCHIVED_ERROR' : 'UNARCHIVED_ERROR',
        ),
      );
    },
  };

  toggleArchived(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (this.line) {
      this.setArchived(!this.getCurrentState());
      this.archiveService
        .changeLineArchived(this.line)
        .subscribe(this.toggleArchivedResultHandler);
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

  confirmArchiveEntity(event: Event, type: 'area' | 'sector' | 'crag') {
    const messageKeys = {
      area: marker('archive.askConfirmArchiveArea'),
      sector: marker('archive.askConfirmArchiveSector'),
      crag: marker('archive.askConfirmArchiveCrag'),
    };

    this.confirmationService.confirm({
      target: event.target,
      message: this.translocoService.translate(messageKeys[type]),
      acceptLabel: this.translocoService.translate(
        marker('archive.yesArchive'),
      ),
      acceptButtonStyleClass: 'p-button-primary',
      rejectButtonStyleClass: 'p-button-secondary',
      rejectLabel: this.translocoService.translate(marker('archive.noCancel')),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.doArchiveEntity(type);
      },
    });
  }

  doArchiveEntity(type: 'area' | 'sector' | 'crag') {
    this.setArchived(true);
    const archiveRequest =
      type === 'area'
        ? this.archiveService.setAreaArchived(this.area)
        : type === 'sector'
          ? this.archiveService.setSectorArchived(this.sector)
          : this.archiveService.setCragArchived(this.crag);

    archiveRequest.subscribe(this.toggleArchivedResultHandler);
  }

  restoreArchivedEntity() {
    this.setArchived(false);
    const archiveRequest = this.area
      ? this.archiveService.restoreArea(this.area)
      : this.sector
        ? this.archiveService.restoreSector(this.sector)
        : this.archiveService.restoreCrag(this.crag);
    archiveRequest.subscribe(this.toggleArchivedResultHandler);
  }

  confirmArchiveTopoImage(event: Event) {
    this.confirmationService.confirm({
      target: event.target,
      message: this.translocoService.translate(
        this.topoImage.publicationStatus === 'archived'
          ? marker('archive.askAlsoUnArchiveLines')
          : marker('archive.askAlsoArchiveLines'),
      ),
      acceptLabel: this.translocoService.translate(
        marker('archive.yesWithLines'),
      ),
      acceptButtonStyleClass: 'p-button-primary',
      rejectButtonStyleClass: 'p-button-secondary',
      rejectLabel: this.translocoService.translate(
        marker('archive.noWithoutLines'),
      ),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.doArchiveTopoImage(true);
      },
      reject: () => {
        this.doArchiveTopoImage(false);
      },
    });
  }

  doArchiveTopoImage(cascadeToLines: boolean) {
    this.setArchived(this.topoImage.publicationStatus !== 'archived');
    this.archiveService
      .changeTopoImageArchived(this.topoImage, cascadeToLines)
      .subscribe(this.toggleArchivedResultHandler);
  }
}
