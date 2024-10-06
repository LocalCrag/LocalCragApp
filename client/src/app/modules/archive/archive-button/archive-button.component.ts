import {Component, Input, ViewEncapsulation} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {NgClass, NgIf} from '@angular/common';
import {SharedModule} from 'primeng/api';
import {Store} from '@ngrx/store';
import {TranslocoDirective, TranslocoService} from '@jsverse/transloco';
import {toastNotification} from "../../../ngrx/actions/notifications.actions";
import {NotificationIdentifier} from "../../../utility/notifications/notification-identifier.enum";
import {ArchiveService} from "../../../services/crud/archive.service";
import {Line} from '../../../models/line';
import {Crag} from "../../../models/crag";
import {Sector} from "../../../models/sector";
import {Area} from "../../../models/area";
import {TopoImage} from '../../../models/topo-image';
import {LinesService} from '../../../services/crud/lines.service';

@Component({
  selector: 'lc-archive-button',
  standalone: true,
  imports: [
    ButtonModule,
    NgIf,
    SharedModule,
    NgClass,
    TranslocoDirective
  ],
  templateUrl: './archive-button.component.html',
  styleUrl: './archive-button.component.scss',
  providers: [
    ArchiveService,
  ],
  encapsulation: ViewEncapsulation.None
})
export class ArchiveButtonComponent {

  @Input() line?: Line;
  @Input() topoImage?: TopoImage;
  @Input() area?: Area;
  @Input() sector?: Sector;
  @Input() crag?: Crag;
  @Input() showLabel: boolean;
  @Input() outline = false;

  constructor(private archiveService: ArchiveService,
              private linesService: LinesService,
              private translocoService: TranslocoService,
              private store: Store) {
  }

  getCurrentState() {
    if (this.line) return this.line.archived;
    if (this.topoImage) return this.topoImage.archived;
    return false;
  }

  switchArchived(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const resultHandler = {
      next: _ => {
        this.store.dispatch(toastNotification(NotificationIdentifier.ARCHIVED))
      },
      error: () => {
        this.store.dispatch(toastNotification(NotificationIdentifier.ARCHIVED_ERROR))
      }
    };

    if (this.line) {
      this.line.archived = !this.line.archived;
      this.linesService.updateLine(this.line).subscribe(resultHandler);
    }

    if (this.topoImage) {
      this.topoImage.archived = !this.topoImage.archived;
      this.linesService.updateLine(this.line).subscribe(resultHandler);
    }

    if (this.area) {
      this.archiveService.archiveArea(this.area.slug).subscribe(resultHandler);
    }

    if (this.sector) {
      this.archiveService.archiveSector(this.sector.slug).subscribe(resultHandler);
    }

    if (this.crag) {
      this.archiveService.archiveCrag(this.crag.slug).subscribe(resultHandler);
    }
  }

}
