import { Component, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ScalesService } from '../../../services/crud/scales.service';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CardModule } from 'primeng/card';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormDirective } from '../../shared/forms/form.directive';
import { LoadingState } from '../../../enums/loading-state';
import { Scale } from '../../../models/scale';
import { ActivatedRoute, Router } from '@angular/router';
import { LineType } from '../../../enums/line-type';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NgForOf, NgIf } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { NotificationIdentifier } from '../../../utility/notifications/notification-identifier.enum';
import { Store } from '@ngrx/store';
import { DropdownModule } from 'primeng/dropdown';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'lc-scale-form',
  standalone: true,
  templateUrl: './scale-form.component.html',
  styleUrl: './scale-form.component.scss',
  imports: [
    TranslocoDirective,
    CardModule,
    ReactiveFormsModule,
    NgForOf,
    SharedModule,
    TranslocoPipe,
    NgIf,
    InputTextModule,
    InputNumberModule,
    ToolbarModule,
    ButtonModule,
    FormsModule,
    ConfirmPopupModule,
    DropdownModule,
    MessageModule
  ],
  providers: [ConfirmationService],
})
@UntilDestroy()
export class ScaleFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  public scaleForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public scale: Scale;
  public editMode = true;

  constructor(
    private fb: FormBuilder,
    private scalesService: ScalesService,
    private confirmationService: ConfirmationService,
    private translocoService: TranslocoService,
    private route: ActivatedRoute,
    protected router: Router,
    private store: Store,
  ) {}

  ngOnInit() {
    const lineType = this.route.snapshot.paramMap.get('lineType') as LineType;
    const name = this.route.snapshot.paramMap.get('name');

    if (!lineType) {
      this.editMode = false;
    }

    this.buildForm();
    this.scaleForm.disable();
    if (this.editMode) {
      this.scalesService.getScale(lineType, name).pipe(catchError((e) => {
        if (e.status === 404) {
          this.router.navigate(['/not-found']);
        }
        return of(e);
      })).subscribe((scale) => {
        this.scale = scale;
        this.setFormValue();
        this.loadingState = LoadingState.DEFAULT;
      });
    } else {
      this.setFormValue();
      this.loadingState = LoadingState.DEFAULT;
    }
  }

  buildForm() {
    this.scaleForm = this.fb.group({
      lineType: this.editMode ? undefined : [LineType.BOULDER, [Validators.required]],
      name: this.editMode ? undefined : ['', Validators.required],
      grades: this.fb.array([], [
        (ctl) => ctl.value.length === (new Set(ctl.value.map(v => v.value))).size ? null : {'not_unique': true}
      ]),
      gradeBrackets: this.fb.array([], [
        (ctl) => ctl.value.length >= 2
          && ctl.value.reduce((p, c) => p && c.value > 0, true)
          && ctl.value.at(-2).value + 1 === ctl.value.at(-1).value
          ? null : {'semantic_error': true},
        (ctl) => ctl.value.length >= 2 && ctl.value.length <= 8 ? null : {'invalid_length': true},
      ]),
    });
  }

  setFormValue() {
    if (this.editMode) {
      this.scale.grades.map((g) => this.fb.group({
        name: [g.name],
        value: [g.value],
      })).forEach((ctl) => this.gradeControls().push(ctl));
      this.scale.gradeBrackets.map((value) => this.fb.group({
        value: [value]
      })).forEach((ctl) => this.gradeBracketsControls().push(ctl));
    } else {
      this.gradeControls().push(this.fb.group({ name: marker('CLOSED_PROJECT'), value: -2 }));
      this.gradeControls().push(this.fb.group({ name: marker('OPEN_PROJECT'), value: -1 }));
      this.gradeControls().push(this.fb.group({ name: marker('UNGRADED'), value: 0 }));
      this.gradeBracketsControls().push(this.fb.group({value: 1}));
      this.gradeBracketsControls().push(this.fb.group({value: 2}));
      this.addGrade();
    }
    this.scaleForm.enable();
  }

  gradeControls() {
    return this.scaleForm.controls.grades as FormArray;
  }

  gradeBracketsControls() {
    return this.scaleForm.controls.gradeBrackets as FormArray;
  }

  reorderByValue() {
    const data = this.gradeControls().value;
    data.sort((a, b) => a.value - b.value);
    this.gradeControls().clear();
    data.filter((g) => Number.isInteger(g.value)).map((g) => this.fb.group({
      name: [g.name],
      value: [g.value],
    })).forEach((ctl) => this.gradeControls().push(ctl));
  }

  addGrade() {
    const max = this.gradeControls().value.reduce((acc, v) => v.value > acc ? v.value : acc, 0);
    this.gradeControls().push(this.fb.group({name: [], value: [max + 1]}));
  }

  deleteGrade(index: number) {
    this.gradeControls().removeAt(index);
  }

  addBracket() {
    const max = this.gradeBracketsControls().value.reduce((acc, v) => v.value > acc ? v.value : acc, 0);
    this.gradeBracketsControls().push(this.fb.group({name: [], value: [max + 1]}));
  }

  deleteBracket(index: number) {
    this.gradeBracketsControls().removeAt(index);
  }

  saveScale() {
    if (this.scaleForm.valid) {
      this.loadingState = LoadingState.LOADING;

      if (this.editMode) {
        this.scale.grades = this.gradeControls().value;
        this.scale.gradeBrackets = this.gradeBracketsControls().value.map((gb) => gb.value);

        this.scalesService.updateScale(this.scale).subscribe({
          next: () => {
            this.store.dispatch(
              toastNotification(NotificationIdentifier.SCALE_UPDATED)
            );
            this.loadingState = LoadingState.DEFAULT
          },
          error: () => {
            this.store.dispatch(
              toastNotification(NotificationIdentifier.SCALE_UPDATED_ERROR)
            );
            this.loadingState = LoadingState.DEFAULT
          },
        });
      } else {
        const scale = new Scale();
        scale.lineType = this.scaleForm.get('lineType').value.value;
        scale.name = this.scaleForm.get('name').value;
        scale.grades = this.gradeControls().value;
        scale.gradeBrackets = this.gradeBracketsControls().value.map((gb) => gb.value);
        this.scalesService.createScale(scale).subscribe({
          next: () => {
            this.store.dispatch(
              toastNotification(NotificationIdentifier.SCALE_CREATED)
            );
            this.loadingState = LoadingState.DEFAULT
            this.router.navigate(['/scales'])
          },
          error: () => {
            this.store.dispatch(
              toastNotification(NotificationIdentifier.SCALE_CREATED_ERROR)
            );
            this.loadingState = LoadingState.DEFAULT
          },
        });
      }
    }
  }

  confirmDeleteScale(event: Event) {
    this.translocoService.load(environment.language).subscribe(() => {
      this.confirmationService.confirm({
        target: event.target,
        message: this.translocoService.translate(marker('scale.scaleForm.confirmDeleteMessage')),
        acceptLabel: this.translocoService.translate(marker('scale.scaleForm.acceptConfirmDelete')),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(marker('scale.scaleForm.cancel')),
        icon: 'pi pi-exclamation-triangle',
        accept: this.deleteScale.bind(this),
      });
    });
  }

  deleteScale() {
    this.loadingState = LoadingState.LOADING;
    this.scalesService.deleteScale(this.scale).subscribe({
      next: () => {
        this.router.navigate(['/scales']);
        this.store.dispatch(
          toastNotification(NotificationIdentifier.SCALE_DELETED),
        );
        this.loadingState = LoadingState.DEFAULT;
      },
      error: () => {
        this.store.dispatch(
          toastNotification(NotificationIdentifier.SCALE_DELETED_ERROR),
        );
        this.loadingState = LoadingState.DEFAULT;
      },
    });
  }

  protected readonly LoadingState = LoadingState;
  protected readonly LineType = LineType;
}
