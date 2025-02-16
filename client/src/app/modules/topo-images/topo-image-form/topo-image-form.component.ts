import {
  Component,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingState } from '../../../enums/loading-state';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { TopoImage } from '../../../models/topo-image';
import { TopoImagesService } from '../../../services/crud/topo-images.service';
import { Title } from '@angular/platform-browser';
import { Editor } from 'primeng/editor';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';

/**
 * Component for uploading topo images.
 */
@Component({
  selector: 'lc-topo-image-form',
  templateUrl: './topo-image-form.component.html',
  styleUrls: ['./topo-image-form.component.scss'],
})
export class TopoImageFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChildren(Editor) editors: QueryList<Editor>;

  public topoImageForm: FormGroup;
  public loadingState = LoadingState.DEFAULT;
  public loadingStates = LoadingState;
  public topoImage: TopoImage;
  public editMode = false;

  private cragSlug: string;
  private sectorSlug: string;
  private areaSlug: string;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private route: ActivatedRoute,
    private title: Title,
    private translocoService: TranslocoService,
    private router: Router,
    private topoImagesService: TopoImagesService,
  ) {}

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.buildForm();
    this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    this.sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
    this.areaSlug = this.route.snapshot.paramMap.get('area-slug');
    const imageId = this.route.snapshot.paramMap.get('image-id');
    if (imageId) {
      this.editMode = true;
      this.topoImageForm.disable();
      this.topoImagesService
        .getTopoImage(imageId)
        .pipe(
          catchError((e) => {
            if (e.status === 404) {
              this.router.navigate(['/not-found']);
            }
            return of(e);
          }),
        )
        .subscribe((topoImage) => {
          this.topoImage = topoImage;
          this.setFormValue();
          this.loadingState = LoadingState.DEFAULT;
          this.editors?.map((editor) => {
            editor.getQuill().enable();
          });
        });
      this.store.select(selectInstanceName).subscribe((instanceName) => {
        this.title.setTitle(
          `${this.translocoService.translate(marker('editTopoImageBrowserTitle'))} - ${instanceName}`,
        );
      });
    } else {
      this.store.select(selectInstanceName).subscribe((instanceName) => {
        this.title.setTitle(
          `${this.translocoService.translate(marker('addTopoImageBrowserTitle'))} - ${instanceName}`,
        );
      });
      this.loadingState = LoadingState.DEFAULT;
    }
  }

  /**
   * Builds the topo image form.
   */
  private buildForm() {
    this.topoImageForm = this.fb.group({
      image: [null, [Validators.required]],
      coordinates: [null],
      title: [null, [Validators.maxLength(120)]],
      description: [null],
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
    if (this.topoImageForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const topoImage = new TopoImage();
      topoImage.image = this.topoImageForm.get('image').value;
      topoImage.title = this.topoImageForm.get('title').value;
      topoImage.description = this.topoImageForm.get('description').value;
      topoImage.coordinates = this.topoImageForm.get('coordinates').value;
      if (this.topoImage) {
        topoImage.id = this.topoImage.id;
        this.topoImagesService.updateTopoImage(topoImage).subscribe(() => {
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
      } else {
        this.topoImagesService
          .addTopoImage(topoImage, this.areaSlug)
          .subscribe(() => {
            this.store.dispatch(toastNotification('TOPO_IMAGE_ADDED'));
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
    } else {
      this.formDirective.markAsTouched();
    }
  }
}
