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
    if (this.line) return this.line.archived;
    if (this.topoImage) return this.topoImage.archived;
    return false;
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
      this.line.archived = !this.line.archived;
      this.archiveService
        .changeLineArchived(this.line)
        .subscribe(this.toggleArchivedResultHandler);
    }

    if (this.topoImage) {
      this.confirmArchiveTopoImage(event);
    }

    if (this.area) {
      this.confirmArchiveEntity(event, 'area');
    }

    if (this.sector) {
      this.confirmArchiveEntity(event, 'sector');
    }

    if (this.crag) {
      this.confirmArchiveEntity(event, 'crag');
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
    const archiveRequest =
      type === 'area'
        ? this.archiveService.setAreaArchived(this.area)
        : type === 'sector'
          ? this.archiveService.setSectorArchived(this.sector)
          : this.archiveService.setCragArchived(this.crag);

    archiveRequest.subscribe(this.archiveEntityResultHandler);
  }

  archiveEntityResultHandler = {
    next: (_) => {
      this.store.dispatch(toastNotification('ARCHIVED'));
    },
    error: () => {
      this.store.dispatch(toastNotification('ARCHIVED_ERROR'));
    },
  };

  confirmArchiveTopoImage(event: Event) {
    this.confirmationService.confirm({
      target: event.target,
      message: this.translocoService.translate(
        this.topoImage.archived
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
    this.topoImage.archived = !this.topoImage.archived;
    this.archiveService
      .changeTopoImageArchived(this.topoImage, cascadeToLines)
      .subscribe(this.toggleArchivedResultHandler);
  }
}
