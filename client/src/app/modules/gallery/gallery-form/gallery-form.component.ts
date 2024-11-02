import {Component, OnInit, ViewChild} from '@angular/core';
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
import { NgIf } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { ButtonModule } from 'primeng/button';
import { MessagesModule } from 'primeng/messages';
import { MultiSelectModule } from 'primeng/multiselect';
import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
} from 'primeng/autocomplete';
import { Searchable } from '../../../models/searchable';
import { SearchService } from '../../../services/crud/search.service';
import { Tag } from '../../../models/tag';

@Component({
  selector: 'lc-gallery-form',
  standalone: true,
  imports: [
    TranslocoDirective,
    NgIf,
    ReactiveFormsModule,
    SharedModule,
    ButtonModule,
    MessagesModule,
    MultiSelectModule,
    AutoCompleteModule,
  ],
  templateUrl: './gallery-form.component.html',
  styleUrl: './gallery-form.component.scss',
})
export class GalleryFormComponent implements OnInit{
  @ViewChild(FormDirective) formDirective: FormDirective;

  public galleryImageForm: FormGroup;
  public editMode = false;
  public galleryImage: GalleryImage;
  public loadingState = LoadingState.DEFAULT;
  public loadingStates = LoadingState;
  public searchablesSuggestions: Searchable[] = [];

  constructor(
    private fb: FormBuilder,
    private searchService: SearchService,
    private galleryService: GalleryService,
  ) {}

  ngOnInit() {
    this.buildForm();

    const galleryImageId = null; // TODO
    if (galleryImageId) {
      this.editMode = true;
      this.galleryImageForm.disable();
      this.galleryService
        .getGalleryImage(galleryImageId)
        .subscribe((galleryImage) => {
          this.galleryImage = galleryImage;
          this.setFormValue();
          this.loadingState = LoadingState.DEFAULT;
        });
    }
  }

  /**
   * Builds the area form.
   */
  private buildForm() {
    this.galleryImageForm = this.fb.group({
      image: [null, [Validators.required]],
      searchables: [[], [Validators.minLength(1)]],
    });
  }

  private setFormValue() {
    this.galleryImageForm.enable();
    this.galleryImageForm.patchValue({
      image: this.galleryImage.image,
      searchables: this.galleryImage.tags, // todo parse
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
        this.galleryService.updateGalleryImage(galleryImage).subscribe(() => {
          this.loadingState = LoadingState.DEFAULT;
        });
      } else {
        this.galleryService.createGalleryImage(galleryImage).subscribe(() => {
          this.loadingState = LoadingState.DEFAULT;
        });
      }
    } else {
      this.formDirective.markAsTouched();
    }
  }

  loadTagSuggestions(event: AutoCompleteCompleteEvent) {
    this.searchService.search(event.query).subscribe((searchables) => {
      this.searchablesSuggestions = searchables;
    });
  }
}
