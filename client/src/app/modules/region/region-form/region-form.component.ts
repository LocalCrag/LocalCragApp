import {
  Component,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  inject,
} from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import { Editor, EditorModule } from 'primeng/editor';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoadingState } from '../../../enums/loading-state';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { UploadService } from '../../../services/crud/upload.service';
import { InstanceSettingsService } from '../../../services/crud/instance-settings.service';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { catchError, switchMap } from 'rxjs/operators';
import { forkJoin, of, throwError } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { RegionService } from '../../../services/crud/region.service';
import { Region } from '../../../models/region';
import { ButtonModule } from 'primeng/button';

import { InputTextModule } from 'primeng/inputtext';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { PageTitleService } from '../../../services/core/page-title.service';
import { SingleImageUploadComponent } from '../../shared/forms/controls/single-image-upload/single-image-upload.component';
import { InstanceSettings } from '../../../models/instance-settings';

/**
 * A component for editing regions.
 */
@Component({
  selector: 'lc-region-form',
  imports: [
    ReactiveFormsModule,
    EditorModule,
    ButtonModule,
    TranslocoDirective,
    TranslocoPipe,
    InputTextModule,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    SingleImageUploadComponent,
  ],
  templateUrl: './region-form.component.html',
  styleUrl: './region-form.component.scss',
})
export class RegionFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChildren(Editor) editors: QueryList<Editor>;

  public regionForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public region: Region;
  public editMode = false;
  public quillModules: any;
  public instanceSettings: InstanceSettings;

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);
  private uploadService = inject(UploadService);
  private regionsService = inject(RegionService);
  private instanceSettingsService = inject(InstanceSettingsService);
  private translocoService = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);

  constructor() {
    this.quillModules = this.uploadService.getQuillFileUploadModules();
  }

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.buildForm();
    this.editMode = true;
    this.setPageTitle();
    this.regionForm.disable();
    forkJoin([
      this.regionsService.getRegion().pipe(
        catchError((e) => {
          if (e.status === 404) {
            this.router.navigate(['/not-found']);
            return of(null);
          }
          return throwError(() => e);
        }),
      ),
      this.instanceSettingsService
        .getInstanceSettings()
        .pipe(catchError(() => of(null))),
    ]).subscribe(([region, instanceSettings]) => {
      if (!region) {
        return;
      }
      this.region = region;
      this.instanceSettings = instanceSettings;
      this.setFormValue();
      this.loadingState = LoadingState.DEFAULT;
      this.editors?.map((editor) => {
        editor.getQuill()?.enable();
      });
    });
  }

  private setPageTitle(): void {
    this.pageTitleService.setTitle(
      this.translocoService.translate(
        marker('region.regionForm.editRegionTitle'),
      ),
    );
  }

  /**
   * Builds the region form.
   */
  private buildForm() {
    this.regionForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      description: [null],
      rules: [null],
      image: [null],
    });
  }

  /**
   * Sets the form value based on an input region and enables the form afterward.
   */
  private setFormValue() {
    this.regionForm.enable();
    this.regionForm.patchValue({
      name: this.region.name,
      description: this.region.description,
      rules: this.region.rules,
      image: this.region.image ?? this.instanceSettings?.bgImage ?? null,
    });
  }

  /**
   * Cancels the form.
   */
  cancel() {
    this.router.navigate(['/topo']);
  }

  /**
   * Saves the crag and navigates to the crag list.
   */
  public saveRegion() {
    if (this.regionForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const region = new Region();
      region.name = this.regionForm.get('name').value;
      region.description = this.regionForm.get('description').value;
      region.rules = this.regionForm.get('rules').value;
      region.image = this.regionForm.get('image').value;
      this.uploadService
        .saveFileFocusIfChanged(region.image)
        .pipe(switchMap(() => this.regionsService.updateRegion(region)))
        .subscribe(() => {
          this.store.dispatch(toastNotification('REGION_UPDATED'));
          this.router.navigate(['/topo']);
          this.loadingState = LoadingState.DEFAULT;
        });
    } else {
      this.formDirective.markAsTouched();
    }
  }
}
