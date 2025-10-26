import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { GalleryImage } from '../../../models/gallery-image';
import { CardModule } from 'primeng/card';
import { ImageModule } from 'primeng/image';

import { TagComponent } from '../../shared/components/tag/tag.component';
import { ButtonModule } from 'primeng/button';
import { Store } from '@ngrx/store';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { MenuItem } from 'primeng/api';
import { SpeedDialModule } from 'primeng/speeddial';
import { User } from '../../../models/user';
import { selectCurrentUser } from '../../../ngrx/selectors/auth.selectors';
import { take } from 'rxjs/operators';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'lc-gallery-image',
  imports: [
    CardModule,
    ImageModule,
    TagComponent,
    ButtonModule,
    ConfirmPopupModule,
    SpeedDialModule,
    TranslocoDirective,
    Tooltip,
  ],
  templateUrl: './gallery-image.component.html',
  styleUrl: './gallery-image.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class GalleryImageComponent implements OnInit {
  @Input() image: GalleryImage;

  @Output() delete: EventEmitter<Event> = new EventEmitter<Event>();
  @Output() edit: EventEmitter<null> = new EventEmitter<null>();

  public speedDialItems: MenuItem[] = [];
  public loggedInUser: User;

  private translocoService = inject(TranslocoService);
  private store = inject(Store);

  ngOnInit() {
    this.speedDialItems = [
      {
        label: this.translocoService.translate(marker('gallery.deleteImage')),
        icon: 'pi pi-pencil',
        command: () => this.edit.emit(),
      },
      {
        label: this.translocoService.translate(marker('gallery.deleteImage')),
        icon: 'pi pi-trash',
        command: (event) => this.delete.emit(event.originalEvent),
      },
    ];
    this.store
      .select(selectCurrentUser)
      .pipe(take(1))
      .subscribe((user) => (this.loggedInUser = user));
  }
}
