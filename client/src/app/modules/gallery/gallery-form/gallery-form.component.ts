import {
  Component,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  inject,
  ChangeDetectionStrategy,
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
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';

import { Searchable } from '../../../models/searchable';
import { Tag } from '../../../models/tag';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { SingleImageUploadComponent } from '../../shared/forms/controls/single-image-upload/single-image-upload.component';
import { TagInputComponent } from '../../shared/forms/controls/tag-input/tag-input.component';
import { ObjectUtilsService } from '../../../services/utils/object-utils.service';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import { lucideInfo } from '@ng-icons/lucide';
import { LoadingButtonComponent } from '../../shared/components/loading-button/loading-button.component';

@Component({
  providers: [provideIcons({ lucideInfo })],
  selector: 'lc-gallery-form',
  imports: [
    LoadingButtonComponent,
    TranslocoDirective,
    TranslocoPipe,
    ReactiveFormsModule,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    SingleImageUploadComponent,
    TagInputComponent,
    HlmAlert,
    HlmAlertDescription,
    NgIcon,
  ],
  templateUrl: './gallery-form.component.html',
  styleUrl: './gallery-form.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class GalleryFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  public galleryImageForm: FormGroup;
  public editMode = false;
  public galleryImage: GalleryImage;
  public loadingState = LoadingState.DEFAULT;
  public loadingStates = LoadingState;
  private context = injectBrnDialogContext<Record<string, any>>();

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private ref = inject(BrnDialogRef);
  private galleryService = inject(GalleryService);
  private objectUtilsService = inject(ObjectUtilsService);

  ngOnInit() {
    this.buildForm();
    if (this.context.galleryImage) {
      this.loadingState = LoadingState.LOADING;
      this.editMode = true;
      this.galleryImageForm.disable();
      this.galleryImage = this.context.galleryImage;
      this.setFormValue();
      this.loadingState = LoadingState.DEFAULT;
    } else {
      this.galleryImageForm.get('searchables').disable();
      this.objectUtilsService
        .getObject(
          this.context.defaultSearchableType,
          this.context.defaultSearchableSlug,
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
      searchables: this.galleryImage.tags.map(Tag.toSearchable),
    });
    this.galleryImageForm.get('image').disable(); // Images cannot be changed, only tags
  }

  public saveGalleryImage() {
    if (this.galleryImageForm.invalid) {
      this.formDirective.markAsTouched();
      return;
    }
    this.loadingState = LoadingState.LOADING;
    const galleryImage = new GalleryImage();
    galleryImage.image = this.galleryImageForm.get('image').value;
    galleryImage.tags = (
      this.galleryImageForm.get('searchables').value as Searchable[]
    ).map(Tag.fromSearchable);
    const request = this.editMode
      ? this.galleryService.updateGalleryImage(
          Object.assign(galleryImage, {
            id: this.galleryImage.id,
            description: this.galleryImage.description,
            lat: this.galleryImage.lat,
            lng: this.galleryImage.lng,
          }),
        )
      : this.galleryService.createGalleryImage(galleryImage);
    request.subscribe({
      next: (saved) => {
        this.loadingState = LoadingState.DEFAULT;
        if (!this.editMode) {
          this.store.dispatch(toastNotification('GALLERY_IMAGE_CREATED'));
        }
        this.ref.close(saved);
      },
      error: () => {
        this.loadingState = LoadingState.DEFAULT;
      },
    });
  }
}
