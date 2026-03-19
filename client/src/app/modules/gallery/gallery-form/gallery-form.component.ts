import {
  Component,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { GalleryService } from '../../../services/crud/gallery.service';
import { GalleryImage } from '../../../models/gallery-image';
import { LoadingState } from '../../../enums/loading-state';
import { TranslocoDirective } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
} from 'primeng/autocomplete';
import { Searchable, SearchableObject } from '../../../models/searchable';
import { SearchService } from '../../../services/crud/search.service';
import { Tag } from '../../../models/tag';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { SearchableComponent } from '../../core/searchable/searchable.component';
import { Message } from 'primeng/message';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { SingleImageUploadComponent } from '../../shared/forms/controls/single-image-upload/single-image-upload.component';
import { ObjectUtilsService } from '../../../services/utils/object-utils.service';

@Component({
  selector: 'lc-gallery-form',
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    ButtonModule,
    MultiSelectModule,
    AutoCompleteModule,
    SearchableComponent,
    Message,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    SingleImageUploadComponent,
  ],
  templateUrl: './gallery-form.component.html',
  styleUrl: './gallery-form.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class GalleryFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  public galleryImageForm: FormGroup;
  public editMode = false;
  public galleryImage: GalleryImage;
  public loadingState = LoadingState.DEFAULT;
  public loadingStates = LoadingState;
  public searchablesSuggestions: Searchable[] = [];
  public config = inject(DynamicDialogConfig);

  private fb = inject(FormBuilder);
  private searchService = inject(SearchService);
  private store = inject(Store);
  private ref = inject(DynamicDialogRef);
  private galleryService = inject(GalleryService);
  private objectUtilsService = inject(ObjectUtilsService);

  ngOnInit() {
    this.buildForm();
    if (this.config.data.galleryImage) {
      this.loadingState = LoadingState.LOADING;
      this.editMode = true;
      this.galleryImageForm.disable();
      this.galleryImage = this.config.data.galleryImage;
      this.setFormValue();
      this.loadingState = LoadingState.DEFAULT;
    } else {
      this.galleryImageForm.get('searchables').disable();
      this.objectUtilsService
        .getObject(
          this.config.data.defaultSearchableType,
          this.config.data.defaultSearchableSlug,
        )
        .pipe(map(Searchable.fromObject))
        .subscribe({
          next: (searchable) => {
            this.galleryImageForm.get('searchables').setValue([searchable]);
          },
          complete: () => {
            this.galleryImageForm.get('searchables').enable();
          },
        });
    }
  }

  private buildForm() {
    this.galleryImageForm = this.fb.group({
      image: [null, [Validators.required]],
      searchables: [[], [Validators.required]],
    });
  }

  private setFormValue() {
    this.galleryImageForm.enable();
    this.galleryImageForm.patchValue({
      image: this.galleryImage.image,
      searchables: this.galleryImage.tags.map((tag) => {
        return Searchable.fromObject(tag.object as SearchableObject);
      }),
    });
    this.galleryImageForm.get('image').disable(); // Images cannot be changed, only tags
  }

  public saveGalleryImage() {
    if (this.galleryImageForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const galleryImage = new GalleryImage();
      galleryImage.image = this.galleryImageForm.get('image').value;
      galleryImage.tags = this.galleryImageForm
        .get('searchables')
        .value.map((searchable: Searchable) => {
          const tag = new Tag();
          tag.object =
            searchable.line ||
            searchable.area ||
            searchable.sector ||
            searchable.crag ||
            searchable.user;
          return tag;
        });
      if (this.editMode) {
        galleryImage.id = this.galleryImage.id;
        this.galleryService
          .updateGalleryImage(galleryImage)
          .subscribe((galleryImage) => {
            this.loadingState = LoadingState.DEFAULT;
            this.ref.close(galleryImage);
            this.store.dispatch(toastNotification('GALLERY_IMAGE_UPDATED'));
          });
      } else {
        this.galleryService
          .createGalleryImage(galleryImage)
          .subscribe((galleryImage) => {
            this.loadingState = LoadingState.DEFAULT;
            this.ref.close(galleryImage);
            this.store.dispatch(toastNotification('GALLERY_IMAGE_CREATED'));
          });
      }
    } else {
      this.formDirective.markAsTouched();
    }
  }

  public loadTagSuggestions(event: AutoCompleteCompleteEvent) {
    this.searchService.search(event.query).subscribe((searchables) => {
      this.searchablesSuggestions = searchables;
    });
  }
}
