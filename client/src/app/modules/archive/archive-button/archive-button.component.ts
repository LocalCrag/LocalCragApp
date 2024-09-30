import {Component, Input, ViewEncapsulation} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {NgClass, NgIf} from '@angular/common';
import {SharedModule} from 'primeng/api';
import {Line} from '../../../models/line';
import {TranslocoDirective, TranslocoService} from '@jsverse/transloco';
import {Store} from '@ngrx/store';
import {toastNotification} from "../../../ngrx/actions/notifications.actions";
import {NotificationIdentifier} from "../../../utility/notifications/notification-identifier.enum";
import {ArchiveService} from "../../../services/crud/archive.service";
import {ArchiveObjects} from "../../../models/archive";

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

  @Input() line: Line;
  @Input() showLabel: boolean;

  constructor(private archiveService: ArchiveService,
              private translocoService: TranslocoService,
              private store: Store) {
  }


  switchArchived(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.line.archived) {
      this.archiveService.updateArchive(ArchiveObjects.fromObjects(true, this.line)).subscribe({
        next: stats => {
          this.store.dispatch(toastNotification(NotificationIdentifier.ARCHIVED))
        },
        error: () => {
          this.store.dispatch(toastNotification(NotificationIdentifier.ARCHIVED_ERROR))
        }
      })
    } else {
      this.archiveService.updateArchive(ArchiveObjects.fromObjects(false, this.line)).subscribe({
        next: stats => {
          this.store.dispatch(toastNotification(NotificationIdentifier.ARCHIVED))
        },
        error: () => {
          this.store.dispatch(toastNotification(NotificationIdentifier.ARCHIVED_ERROR))
        }
      })
    }
  }

}
