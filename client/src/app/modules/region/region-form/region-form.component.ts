import {
  Component,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
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
import { TranslocoDirective } from '@jsverse/transloco';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { RegionService } from '../../../services/crud/region.service';
import { Region } from '../../../models/region';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { NgIf } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';

/**
 * A component for editing regions.
 */
@Component({
  selector: 'lc-region-form',
  imports: [
    CardModule,
    ReactiveFormsModule,
    EditorModule,
    ButtonModule,
    NgIf,
    TranslocoDirective,
    InputTextModule,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
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

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private router: Router,
    private uploadService: UploadService,
    private regionsService: RegionService,
  ) {
    this.quillModules = this.uploadService.getQuillFileUploadModules();
  }

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.buildForm();
    this.editMode = true;
    this.regionForm.disable();
    this.regionsService
      .getRegion()
      .pipe(
        catchError((e) => {
          if (e.status === 404) {
            this.router.navigate(['/not-found']);
          }
          return of(e);
        }),
      )
      .subscribe((crag) => {
        this.region = crag;
        this.setFormValue();
        this.loadingState = LoadingState.DEFAULT;
        this.editors?.map((editor) => {
          editor.getQuill().enable();
        });
      });
  }

  /**
   * Builds the region form.
   */
  private buildForm() {
    this.regionForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      description: [''],
      rules: [''],
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
      this.regionsService.updateRegion(region).subscribe(() => {
        this.store.dispatch(toastNotification('REGION_UPDATED'));
        this.router.navigate(['/topo']);
        this.loadingState = LoadingState.DEFAULT;
      });
    } else {
      this.formDirective.markAsTouched();
    }
  }
}
