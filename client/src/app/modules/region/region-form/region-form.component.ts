import {Component, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {FormDirective} from '../../shared/forms/form.directive';
import {Editor, EditorModule} from 'primeng/editor';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {LoadingState} from '../../../enums/loading-state';
import {Crag} from '../../../models/crag';
import {Store} from '@ngrx/store';
import {ActivatedRoute, Router} from '@angular/router';
import {Title} from '@angular/platform-browser';
import {UploadService} from '../../../services/crud/upload.service';
import {CragsService} from '../../../services/crud/crags.service';
import {TranslocoDirective, TranslocoService} from '@ngneat/transloco';
import {ConfirmationService} from 'primeng/api';
import {catchError} from 'rxjs/operators';
import {of} from 'rxjs';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {environment} from '../../../../environments/environment';
import {latValidator} from '../../../utility/validators/lat.validator';
import {lngValidator} from '../../../utility/validators/lng.validator';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';
import {RegionsService} from '../../../services/crud/regions.service';
import {Region} from '../../../models/region';
import {CardModule} from 'primeng/card';
import {SharedModule} from '../../shared/shared.module';
import {ButtonModule} from 'primeng/button';
import {NgIf} from '@angular/common';

/**
 * A component for editing regions.
 */
@Component({
  selector: 'lc-region-form',
  standalone: true,
  imports: [
    CardModule,
    ReactiveFormsModule,
    SharedModule,
    EditorModule,
    ButtonModule,
    NgIf,
    TranslocoDirective
  ],
  templateUrl: './region-form.component.html',
  styleUrl: './region-form.component.scss'
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

  constructor(private fb: FormBuilder,
              private store: Store,
              private router: Router,
              private uploadService: UploadService,
              private regionsService: RegionsService) {
    this.quillModules = this.uploadService.getQuillFileUploadModules();
  }

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.buildForm();
    this.editMode = true;
    this.regionForm.disable();
    this.regionsService.getRegion(environment.regionSlug).pipe(catchError(e => {
      if (e.status === 404) {
        this.router.navigate(['/not-found']);
      }
      return of(e);
    })).subscribe(crag => {
      this.region = crag;
      this.setFormValue();
      this.loadingState = LoadingState.DEFAULT;
      this.editors?.map(editor => {
        editor.getQuill().enable();
      });
    });
  }

  /**
   * Builds the region form.
   */
  private buildForm() {
    this.regionForm = this.fb.group({
      description: [''],
    });
  }

  /**
   * Sets the form value based on an input region and enables the form afterward.
   */
  private setFormValue() {
    this.regionForm.enable();
    this.regionForm.patchValue({
      description: this.region.description,
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
      region.description = this.regionForm.get('description').value
      region.slug = environment.regionSlug;
      this.regionsService.updateRegion(region).subscribe(region => {
        this.store.dispatch(toastNotification(NotificationIdentifier.REGION_UPDATED));
        this.router.navigate(['/topo']);
        this.loadingState = LoadingState.DEFAULT;
      });
    } else {
      this.formDirective.markAsTouched();
    }
  }


}
