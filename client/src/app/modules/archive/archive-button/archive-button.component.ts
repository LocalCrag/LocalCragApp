import { Component, Input, ViewEncapsulation } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { NgClass, NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { TranslocoDirective } from '@jsverse/transloco';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { Line } from '../../../models/line';
import { Crag } from '../../../models/crag';
import { Sector } from '../../../models/sector';
import { Area } from '../../../models/area';
import { TopoImage } from '../../../models/topo-image';
import { ArchiveService } from '../../../services/crud/archive.service';
import { GymModeDirective } from '../../shared/directives/gym-mode.directive';

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
    private store: Store,
  ) {}

  getCurrentState() {
    if (this.line) return this.line.archived;
    if (this.topoImage) return this.topoImage.archived;
    return false;
  }

  toggleArchived(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const resultHandler = {
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

    if (this.line) {
      this.line.archived = !this.line.archived;
      this.archiveService
        .changeLineArchived(this.line)
        .subscribe(resultHandler);
    }

    if (this.topoImage) {
      this.topoImage.archived = !this.topoImage.archived;
      this.archiveService
        .changeTopoImageArchived(this.topoImage)
        .subscribe(resultHandler);
    }

    if (this.area) {
      this.archiveService.setAreaArchived(this.area).subscribe(resultHandler);
    }

    if (this.sector) {
      this.archiveService
        .setSectorArchived(this.sector)
        .subscribe(resultHandler);
    }

    if (this.crag) {
      this.archiveService.setCragArchived(this.crag).subscribe(resultHandler);
    }
  }
}
