import { Component, OnInit, ViewChild } from '@angular/core';
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
import { JsonPipe, NgIf } from '@angular/common';
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
import { ObjectType, Tag } from '../../../models/tag';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { NotificationIdentifier } from '../../../utility/notifications/notification-identifier.enum';
import { Store } from '@ngrx/store';
import { EMPTY, Observable } from 'rxjs';
import { LinesService } from '../../../services/crud/lines.service';
import { AreasService } from '../../../services/crud/areas.service';
import { SectorsService } from '../../../services/crud/sectors.service';
import { CragsService } from '../../../services/crud/crags.service';
import { UsersService } from '../../../services/crud/users.service';
import { map } from 'rxjs/operators';

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
    JsonPipe,
  ],
  templateUrl: './gallery-form.component.html',
  styleUrl: './gallery-form.component.scss',
})
export class GalleryFormComponent implements OnInit {
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
    private linesService: LinesService,
    private areasService: AreasService,
    private sectorsService: SectorsService,
    private cragsService: CragsService,
    private usersService: UsersService,
    private store: Store,
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private galleryService: GalleryService,
  ) {}

  ngOnInit() {
    this.buildForm();

    const galleryImageId = null; // TODO
    if (galleryImageId) {
      this.loadingState = LoadingState.LOADING;
      this.editMode = true;
      this.galleryImageForm.disable();
      this.galleryService
        .getGalleryImage(galleryImageId)
        .subscribe((galleryImage) => {
          this.galleryImage = galleryImage;
          this.setFormValue();
          this.loadingState = LoadingState.DEFAULT;
        });
    } else {
      this.galleryImageForm.get('searchables').disable();
      let defaultSearchableRequest: Observable<Searchable>;
      console.log(this.config.data);
      switch (this.config.data.defaultSearchableType) {
        case ObjectType.Crag:
          defaultSearchableRequest = this.cragsService
            .getCrag(this.config.data.defaultSearchableSlug)
            .pipe(
              map((crag) => {
                const searchable = new Searchable();
                searchable.crag = crag;
                searchable.name = crag.name;
                searchable.id = crag.id;
                return searchable;
              }),
            );
          break;
        case ObjectType.Sector:
          defaultSearchableRequest = this.sectorsService
            .getSector(this.config.data.defaultSearchableSlug)
            .pipe(
              map((sector) => {
                const searchable = new Searchable();
                searchable.sector = sector;
                searchable.name = sector.name;
                searchable.id = sector.id;
                return searchable;
              }),
            );
          break;
        case ObjectType.Area:
          defaultSearchableRequest = this.areasService
            .getArea(this.config.data.defaultSearchableSlug)
            .pipe(
              map((area) => {
                const searchable = new Searchable();
                searchable.area = area;
                searchable.name = area.name;
                searchable.id = area.id;
                return searchable;
              }),
            );
          break;
        case ObjectType.Line:
          defaultSearchableRequest = this.linesService
            .getLine(this.config.data.defaultSearchableSlug)
            .pipe(
              map((line) => {
                const searchable = new Searchable();
                searchable.line = line;
                searchable.name = line.name;
                searchable.id = line.id;
                return searchable;
              }),
            );
          break;
        case ObjectType.User:
          defaultSearchableRequest = this.usersService
            .getUser(this.config.data.defaultSearchableSlug)
            .pipe(
              map((user) => {
                const searchable = new Searchable();
                searchable.user = user;
                searchable.name = user.fullname;
                searchable.id = user.id;
                return searchable;
              }),
            );
          break;
        default:
          defaultSearchableRequest = EMPTY;
      }
      defaultSearchableRequest.subscribe((searchable) => {
        this.galleryImageForm.get('searchables').setValue([searchable]);
        this.galleryImageForm.get('searchables').enable();
      });
    }
  }

  /**
   * Builds the area form.
   */
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
        this.galleryService
          .updateGalleryImage(galleryImage)
          .subscribe((galleryImage) => {
            this.loadingState = LoadingState.DEFAULT;
            this.ref.close(galleryImage);
            this.store.dispatch(
              toastNotification(NotificationIdentifier.GALLERY_IMAGE_CREATED),
            );
          });
      } else {
        this.galleryService
          .createGalleryImage(galleryImage)
          .subscribe((galleryImage) => {
            this.loadingState = LoadingState.DEFAULT;
            this.ref.close(galleryImage);
            this.store.dispatch(
              toastNotification(NotificationIdentifier.GALLERY_IMAGE_UPDATED),
            );
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
