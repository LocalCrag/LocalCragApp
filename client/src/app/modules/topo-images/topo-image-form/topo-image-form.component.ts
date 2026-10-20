import {
  Component,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  inject,
} from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoadingState } from '../../../enums/loading-state';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { catchError, concatMap, switchMap, tap, toArray } from 'rxjs/operators';
import { EMPTY, forkJoin, from, throwError } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { TopoImage } from '../../../models/topo-image';
import { Sector } from '../../../models/sector';
import { Area } from '../../../models/area';
import { Line } from '../../../models/line';
import { File } from '../../../models/file';
import { TopoImagesService } from '../../../services/crud/topo-images.service';
import { Title } from '@angular/platform-browser';
import { Editor } from 'primeng/editor';
import {
  selectInstanceName,
  selectInstanceSettingsState,
} from '../../../ngrx/selectors/instance-settings.selectors';
import { PageTitleService } from '../../../services/core/page-title.service';

import { SingleImageUploadComponent } from '../../shared/forms/controls/single-image-upload/single-image-upload.component';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { InputText } from 'primeng/inputtext';
import { CoordinatesComponent } from '../../shared/forms/controls/coordinates/coordinates.component';
import { Button } from 'primeng/button';
import { MoveObjectDialogComponent } from '../../shared/components/move-object-dialog/move-object-dialog.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { AreasService } from '../../../services/crud/areas.service';
import { UploadService } from '../../../services/crud/upload.service';
import { ApiService } from '../../../services/core/api.service';
import { FileUpload } from 'primeng/fileupload';
import { ProgressBar } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';

/**
 * Component for uploading topo images.
 */
@Component({
  selector: 'lc-topo-image-form',
  templateUrl: './topo-image-form.component.html',
  styleUrls: ['./topo-image-form.component.scss'],
  imports: [
    TranslocoDirective,
    TranslocoPipe,
    ReactiveFormsModule,
    SingleImageUploadComponent,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    InputText,
    Editor,
    CoordinatesComponent,
    Button,
    MoveObjectDialogComponent,
    HasPermissionDirective,
    FileUpload,
    ProgressBar,
    DividerModule,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'topoImage' }],
})
export class TopoImageFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChildren(Editor) editors: QueryList<Editor>;
  @ViewChildren(CoordinatesComponent)
  coordinateFields: QueryList<CoordinatesComponent>;
  @ViewChild('moveDialog') moveDialog: MoveObjectDialogComponent;

  public topoImageForm: FormGroup;
  public loadingState = LoadingState.DEFAULT;
  public loadingStates = LoadingState;
  public topoImage: TopoImage;
  public editMode = false;
  public uploadUrl: string;
  public maxImageSize: number;
  public showProgressBar = false;
  public progress: number = null;
  public progressMode: 'determinate' | 'indeterminate' = 'determinate';
  public imagesTouched = false;

  private cragSlug: string;
  private sectorSlug: string;
  private areaSlug: string;

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private title = inject(Title);
  private translocoService = inject(TranslocoService);
  private router = inject(Router);
  private topoImagesService = inject(TopoImagesService);
  private areasService = inject(AreasService);
  private uploadService = inject(UploadService);
  private pageTitleService = inject(PageTitleService);
  private api = inject(ApiService);
  private parentArea: Area;

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    this.sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
    this.areaSlug = this.route.snapshot.paramMap.get('area-slug');
    const imageId = this.route.snapshot.paramMap.get('image-id');
    if (imageId) {
      this.editMode = true;
      this.buildEditForm();
      this.setPageTitle();
      this.topoImageForm.disable();
      forkJoin([
        this.topoImagesService.getTopoImage(imageId).pipe(
          catchError((e) => {
            if (e.status === 404) {
              this.router.navigate(['/not-found']);
              return EMPTY;
            }
            return throwError(() => e);
          }),
        ),
        this.areasService.getArea(this.areaSlug),
      ]).subscribe(([topoImage, area]) => {
        this.topoImage = topoImage;
        this.parentArea = area;
        this.setFormValue();
        this.loadingState = LoadingState.DEFAULT;
        this.editors?.map((editor) => {
          editor.getQuill()?.enable();
        });
      });
      this.store.select(selectInstanceName).subscribe((instanceName) => {
        this.title.setTitle(
          `${this.translocoService.translate(marker('editTopoImageBrowserTitle'))} - ${instanceName}`,
        );
      });
    } else {
      this.buildCreateForm();
      this.uploadUrl = this.api.uploader.uploadFile();
      this.store.select(selectInstanceSettingsState).subscribe((settings) => {
        this.maxImageSize = settings?.maxImageSize * 1048576;
      });
      this.setPageTitle();
      this.store.select(selectInstanceName).subscribe((instanceName) => {
        this.title.setTitle(
          `${this.translocoService.translate(marker('addTopoImageBrowserTitle'))} - ${instanceName}`,
        );
      });
      this.loadingState = LoadingState.DEFAULT;
    }
  }

  /** t(topoImage.topoImageForm.editTopoImageTitle, topoImage.topoImageForm.addTopoImageTitle) */
  private setPageTitle(): void {
    this.pageTitleService.setTitle(
      this.translocoService.translate(
        this.editMode
          ? 'topoImage.topoImageForm.editTopoImageTitle'
          : 'topoImage.topoImageForm.addTopoImageTitle',
      ),
    );
  }

  get images(): FormArray {
    return this.topoImageForm?.get('images') as FormArray;
  }

  get hasUploadedImages(): boolean {
    return this.images?.length > 0;
  }

  get coordinatesBusy(): boolean {
    return (
      this.coordinateFields?.some((field) => field.positionLoading) ?? false
    );
  }

  /**
   * Builds the single-image edit form.
   */
  private buildEditForm() {
    this.topoImageForm = this.fb.group({
      image: [null, [Validators.required]],
      coordinates: [null],
      title: [null, [Validators.maxLength(120)]],
      description: [null],
    });
  }

  /**
   * Builds the create form. Detail fields are added per uploaded image.
   */
  private buildCreateForm() {
    this.topoImageForm = this.fb.group({
      images: this.fb.array([]),
    });
  }

  private setFormValue() {
    this.topoImageForm.enable();
    this.topoImageForm.patchValue({
      title: this.topoImage.title,
      description: this.topoImage.description,
      coordinates: this.topoImage.coordinates,
      image: this.topoImage.image,
    });
    this.topoImageForm.get('image').disable();
  }

  /**
   * Appends one detail form for each file in a completed upload.
   */
  addUploadedImages(event: any) {
    this.showProgressBar = false;
    for (const fileBody of event.originalEvent.body) {
      this.addImageGroup(File.deserialize(fileBody));
    }
  }

  startProgress() {
    this.showProgressBar = true;
    this.progress = 0;
    this.progressMode = 'determinate';
  }

  setProgress(event: { progress: number }) {
    this.progress = event.progress;
    if (this.progress === 100) {
      this.progressMode = 'indeterminate';
      this.progress = null;
    }
  }

  private addImageGroup(file: File) {
    const group = this.fb.group({
      image: [file, [Validators.required]],
      coordinates: [null],
      title: [null, [Validators.maxLength(120)]],
      description: [null],
    });
    const imageControl = group.get('image');
    const subscription = imageControl.valueChanges.subscribe((value) => {
      if (value) {
        return;
      }
      subscription.unsubscribe();
      const index = this.images.controls.indexOf(group);
      if (index >= 0) {
        this.images.removeAt(index);
      }
    });
    this.images.push(group);
  }

  /**
   * Cancels the form.
   */
  cancel() {
    this.router.navigate([
      '/topo',
      this.cragSlug,
      this.sectorSlug,
      this.areaSlug,
      'topo-images',
    ]);
  }

  /**
   * Saves the topo image and navigates to the topo image list.
   */
  public saveTopoImage() {
    if (this.editMode) {
      this.saveEditedTopoImage();
      return;
    }
    this.saveCreatedTopoImages();
  }

  private saveEditedTopoImage() {
    if (this.topoImageForm.invalid) {
      this.formDirective.markAsTouched();
      return;
    }
    this.loadingState = LoadingState.LOADING;
    const topoImage = this.topoImageFromGroup(this.topoImageForm);
    topoImage.id = this.topoImage.id;
    this.uploadService
      .saveFileFocusIfChanged(topoImage.image)
      .pipe(switchMap(() => this.topoImagesService.updateTopoImage(topoImage)))
      .subscribe(() => {
        this.store.dispatch(toastNotification('TOPO_IMAGE_UPDATED'));
        this.router.navigate([
          '/topo',
          this.cragSlug,
          this.sectorSlug,
          this.areaSlug,
          'topo-images',
        ]);
        this.loadingState = LoadingState.DEFAULT;
      });
  }

  private saveCreatedTopoImages() {
    this.imagesTouched = true;
    if (this.images.length === 0 || this.topoImageForm.invalid) {
      this.formDirective.markAsTouched();
      return;
    }
    this.loadingState = LoadingState.LOADING;
    const groups = [...this.images.controls] as FormGroup[];
    from(groups)
      .pipe(
        concatMap((group) =>
          this.createTopoImage(group).pipe(
            tap(() => {
              const index = this.images.controls.indexOf(group);
              if (index >= 0) {
                this.images.removeAt(index);
              }
            }),
          ),
        ),
        toArray(),
      )
      .subscribe({
        next: (saved) => {
          this.store.dispatch(
            toastNotification(
              saved.length === 1 ? 'TOPO_IMAGE_ADDED' : 'TOPO_IMAGES_ADDED',
            ),
          );
          this.router.navigate([
            '/topo',
            this.cragSlug,
            this.sectorSlug,
            this.areaSlug,
            'topo-images',
          ]);
          this.loadingState = LoadingState.DEFAULT;
        },
        error: () => {
          this.loadingState = LoadingState.DEFAULT;
        },
      });
  }

  private createTopoImage(group: FormGroup) {
    const topoImage = this.topoImageFromGroup(group);
    return this.uploadService
      .saveFileFocusIfChanged(topoImage.image)
      .pipe(
        switchMap(() =>
          this.topoImagesService.addTopoImage(topoImage, this.areaSlug),
        ),
      );
  }

  private topoImageFromGroup(group: FormGroup): TopoImage {
    const topoImage = new TopoImage();
    topoImage.image = group.get('image').value;
    topoImage.title = group.get('title').value;
    topoImage.description = group.get('description').value;
    topoImage.coordinates = group.get('coordinates').value;
    return topoImage;
  }

  openMoveDialog() {
    this.moveDialog.open(this.topoImage, this.parentArea.id);
  }

  onObjectMoved(obj: TopoImage | Sector | Area | Line) {
    const movedImage = obj as TopoImage;
    this.router.navigate([movedImage.area.routerLink, 'topo-images']);
  }
}
