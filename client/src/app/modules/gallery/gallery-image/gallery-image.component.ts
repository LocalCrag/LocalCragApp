import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { GalleryImage } from '../../../models/gallery-image';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideEye,
  lucideInfo,
  lucideMenu,
  lucidePencil,
  lucideTrash2,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCard, HlmCardContent } from '@spartan-ng/helm/card';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';

import { TagComponent } from '../../shared/components/tag/tag.component';
import { Store } from '@ngrx/store';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { User } from '../../../models/user';
import { selectCurrentUser } from '../../../ngrx/selectors/auth.selectors';
import { take } from 'rxjs/operators';
import { galleryImageAspectRatio } from '../../../utility/gallery-masonry';

@Component({
  selector: 'lc-gallery-image',
  imports: [
    HlmButton,
    HlmCard,
    HlmCardContent,
    ...HlmDropdownMenuImports,
    HlmTooltip,
    NgIcon,
    TagComponent,
    TranslocoDirective,
    TranslocoPipe,
  ],
  providers: [
    provideIcons({
      lucideEye,
      lucideInfo,
      lucideMenu,
      lucidePencil,
      lucideTrash2,
    }),
  ],
  templateUrl: './gallery-image.component.html',
  styleUrl: './gallery-image.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class GalleryImageComponent implements OnInit {
  @Input() image: GalleryImage;

  @Output() delete: EventEmitter<Event> = new EventEmitter<Event>();
  @Output() edit: EventEmitter<null> = new EventEmitter<null>();
  @Output() preview = new EventEmitter<void>();

  emitDelete(): void {
    this.delete.emit(new MouseEvent('click'));
  }

  public loggedInUser: User;

  private store = inject(Store);

  ngOnInit() {
    this.store
      .select(selectCurrentUser)
      .pipe(take(1))
      .subscribe((user) => (this.loggedInUser = user));
  }

  aspectRatio(): string {
    return galleryImageAspectRatio(
      this.image?.image?.width,
      this.image?.image?.height,
    );
  }
}
