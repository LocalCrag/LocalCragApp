import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {LoadingState} from '../../../enums/loading-state';
import {DropdownModule} from 'primeng/dropdown';
import {EditorModule} from 'primeng/editor';
import {InputTextModule} from 'primeng/inputtext';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {SharedModule} from '../../shared/shared.module';
import {TranslocoDirective, TranslocoPipe, TranslocoService} from '@ngneat/transloco';
import {CheckboxModule} from 'primeng/checkbox';
import {ButtonModule} from 'primeng/button';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {NgIf} from '@angular/common';
import {RatingModule} from 'primeng/rating';
import {Grade, GRADES} from '../../../utility/misc/grades';
import {FormDirective} from '../../shared/forms/form.directive';
import {Line} from '../../../models/line';
import {Store} from '@ngrx/store';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {ConfirmationService} from 'primeng/api';
import {yearOfDateNotInFutureValidator} from '../../../utility/validators/year-not-in-future.validator';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';
import {Ascent} from '../../../models/ascent';
import {AscentsService} from '../../../services/crud/ascents.service';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {InputTextareaModule} from 'primeng/inputtextarea';
import {CalendarModule} from 'primeng/calendar';
import {ToggleButtonModule} from 'primeng/togglebutton';
import {dateNotInFutureValidator} from '../../../utility/validators/date-not-in-future.validator';
import {DividerModule} from 'primeng/divider';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {filter} from 'rxjs/operators';
import {MessageModule} from 'primeng/message';

@Component({
  selector: 'lc-ascent-form',
  standalone: true,
  imports: [
    DropdownModule,
    EditorModule,
    InputTextModule,
    ReactiveFormsModule,
    SharedModule,
    SharedModule,
    TranslocoPipe,
    CheckboxModule,
    SharedModule,
    ButtonModule,
    ConfirmPopupModule,
    NgIf,
    TranslocoDirective,
    SharedModule,
    SharedModule,
    RatingModule,
    InputTextareaModule,
    CalendarModule,
    ToggleButtonModule,
    FormsModule,
    DividerModule,
    MessageModule
  ],
  templateUrl: './ascent-form.component.html',
  styleUrl: './ascent-form.component.scss',
  encapsulation: ViewEncapsulation.None
})
@UntilDestroy()
export class AscentFormComponent implements OnInit {

  @ViewChild(FormDirective) formDirective: FormDirective;

  public ascentForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public line: Line;
  public grades = GRADES.FB.filter(grade => grade.value >= 0);
  public today = new Date();
  public gradeDifferenceWarning = false;

  constructor(private fb: FormBuilder,
              private dialogConfig: DynamicDialogConfig,
              private store: Store,
              private ref: DynamicDialogRef,
              private ascentsService: AscentsService) {
    this.line = this.dialogConfig.data.line;
  }

  ngOnInit() {
    this.buildForm();
  }

  private buildForm() {
    this.ascentForm = this.fb.group({
      grade: [this.line.grade, [Validators.required]],
      rating: [null, [Validators.required]],
      year: [new Date(), [yearOfDateNotInFutureValidator()]],
      date: [new Date(), [dateNotInFutureValidator()]],
      soft: [false],
      hard: [false],
      fa: [false],
      flash: [false],
      withKneepad: [false],
      comment: [null],
      yearOnly: [false]
    });
    this.ascentForm.get('soft').valueChanges.pipe(untilDestroyed(this), filter(x => x)).subscribe(() => {
      this.ascentForm.get('hard').setValue(false);
    });
    this.ascentForm.get('hard').valueChanges.pipe(untilDestroyed(this), filter(x => x)).subscribe(() => {
      this.ascentForm.get('soft').setValue(false);
    });
    this.ascentForm.get('grade').valueChanges.pipe(untilDestroyed(this)).subscribe((newGrade: Grade) => {
      this.gradeDifferenceWarning = Math.abs(this.line.grade.value - newGrade.value) >= 3;
    });
  }

  public saveAscent() {
    if (this.ascentForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const ascent = new Ascent();
      ascent.grade = this.ascentForm.get('grade').value;
      ascent.rating = this.ascentForm.get('rating').value;
      ascent.year = this.ascentForm.get('yearOnly').value ? this.ascentForm.get('year').value.getFullYear() : null;
      ascent.date = !this.ascentForm.get('yearOnly').value ? this.ascentForm.get('date').value : null;
      ascent.soft = this.ascentForm.get('soft').value;
      ascent.hard = this.ascentForm.get('hard').value;
      ascent.fa = this.ascentForm.get('fa').value;
      ascent.flash = this.ascentForm.get('flash').value;
      ascent.withKneepad = this.ascentForm.get('withKneepad').value;
      ascent.comment = this.ascentForm.get('comment').value;
      ascent.line = this.line;
      this.ascentsService.createAscent(ascent).subscribe(ascent => {
        this.store.dispatch(toastNotification(NotificationIdentifier.ASCENT_ADDED));
        this.loadingState = LoadingState.DEFAULT;
        // todo update stuff after saving
        this.ref.close();
      });
    } else {
      this.formDirective.markAsTouched();
    }
  }

  setToLastSunday() {
    const lastSaturday = new Date(new Date().setDate(this.today.getDate() - (this.today.getDay() == 0 ? 7 : this.today.getDay())));
    this.ascentForm.get('date').setValue(lastSaturday);
    this.ascentForm.get('year').setValue(lastSaturday);
    this.ascentForm.get('yearOnly').setValue(false);
  }

  setToLastSaturday() {
    const lastSaturday = new Date(new Date().setDate(this.today.getDate() - (this.today.getDay() == 0 ? 7 : this.today.getDay() + 1)));
    this.ascentForm.get('date').setValue(lastSaturday);
    this.ascentForm.get('year').setValue(lastSaturday);
    this.ascentForm.get('yearOnly').setValue(false);
  }

  setToToday() {
    this.ascentForm.get('date').setValue(new Date());
    this.ascentForm.get('year').setValue(new Date());
    this.ascentForm.get('yearOnly').setValue(false);
  }

}
