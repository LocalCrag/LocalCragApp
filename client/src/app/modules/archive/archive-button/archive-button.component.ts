import { Component, Input, ViewEncapsulation } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { NgClass, NgIf } from '@angular/common';
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
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'lc-archive-button',
  imports: [ButtonModule, NgIf, NgClass, TranslocoDirective, GymModeDirective],
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

  constructor(
    private archiveService: ArchiveService,
    private confirmationService: ConfirmationService,
    private translocoService: TranslocoService,
    private store: Store,
  ) {}

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
      this.archiveService
        .setAreaArchived(this.area)
        .subscribe(this.toggleArchivedResultHandler);
    }

    if (this.sector) {
      this.archiveService
        .setSectorArchived(this.sector)
        .subscribe(this.toggleArchivedResultHandler);
    }

    if (this.crag) {
      this.archiveService
        .setCragArchived(this.crag)
        .subscribe(this.toggleArchivedResultHandler);
    }
  }

  confirmArchiveTopoImage(event: Event) {
    this.translocoService.load(`${environment.language}`).subscribe(() => {
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
    });
  }

  doArchiveTopoImage(cascadeToLines: boolean) {
    this.topoImage.archived = !this.topoImage.archived;
    this.archiveService
      .changeTopoImageArchived(this.topoImage, cascadeToLines)
      .subscribe(this.toggleArchivedResultHandler);
  }
}
