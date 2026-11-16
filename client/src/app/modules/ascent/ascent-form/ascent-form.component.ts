import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  ChangeDetectionStrategy,
} from '@angular/core';
import { LoadingState } from '../../../enums/loading-state';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { AsyncPipe } from '@angular/common';
import { FormDirective } from '../../shared/forms/form.directive';
import { Line } from '../../../models/line';
import { Store } from '@ngrx/store';
import { yearOfDateNotInFutureValidator } from '../../../utility/validators/year-not-in-future.validator';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { Ascent } from '../../../models/ascent';
import { AscentsService } from '../../../services/crud/ascents.service';
import { dateNotInFutureValidator } from '../../../utility/validators/date-not-in-future.validator';
import { startSecondsValidator } from '../../../utility/validators/start-seconds.validator';

import { filter, take } from 'rxjs/operators';
import { reloadAfterAscent } from '../../../ngrx/actions/ascent.actions';
import { ScalesService } from '../../../services/crud/scales.service';
import { TranslateSpecialGradesPipe } from '../../shared/pipes/translate-special-grades.pipe';
import { TranslateSpecialGradesService } from '../../../services/core/translate-special-grades.service';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { selectGymMode } from '../../../ngrx/selectors/instance-settings.selectors';
import { Observable } from 'rxjs';
import { Grade } from '../../../models/scale';
import {
  daysBackToLastSaturday,
  daysBackToLastSunday,
  subtractLocalCalendarDays,
} from './ascent-quick-preset-dates';
import { externalVideoUrlValidator } from '../../../utility/validators/external-video-url.validator';
import { providerForUrl } from '../../../utility/video-source';
import { Video } from '../../../models/video';
import { AscentFormTitleComponent } from '../ascent-form-title/ascent-form-title.component';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmToggle } from '@spartan-ng/helm/toggle';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideCircleQuestionMark,
  lucideClock,
  lucideInfo,
  lucidePlus,
  lucideStar,
  lucideTriangleAlert,
  lucideX,
} from '@ng-icons/lucide';

@Component({
  providers: [
    provideIcons({
      lucideCircleQuestionMark,
      lucideClock,
      lucideInfo,
      lucidePlus,
      lucideStar,
      lucideTriangleAlert,
      lucideX,
    }),
  ],
  selector: 'lc-ascent-form',
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    TranslocoPipe,
    FormsModule,
    TranslateSpecialGradesPipe,
    IfErrorDirective,
    FormControlDirective,
    ControlGroupDirective,
    FormDirective,
    AsyncPipe,
    HlmButton,
    HlmAlert,
    HlmAlertDescription,
    ...HlmSelectImports,
    HlmInput,
    HlmTextarea,
    ...HlmDatePickerImports,
    HlmToggle,
    HlmTooltip,
    HlmSeparator,
    HlmSpinner,
    NgIcon,
    AscentFormTitleComponent,
  ],
  templateUrl: './ascent-form.component.html',
  styleUrl: './ascent-form.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class AscentFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  public ascentForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public line: Line;
  public ascent: Ascent;
  public grades = [];
  public today: Date;
  public gradeDifferenceWarning = false;
  public editMode = false;
  public videoFormOpen = false;
  public videoStartOpen = false;
  public formatDay = (date: Date) =>
    `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
  public formatYear = (date: Date) => String(date.getFullYear());
  public toggleButtonDt = {
    checkedBackground: '{primary.500}',
    contentCheckedBackground: '{primary.500}',
    checkedColor: '{surface.0}',
  };
  public gymMode$: Observable<boolean>;

  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private context = injectBrnDialogContext<Record<string, any>>();
  private store = inject(Store);
  private ref = inject(BrnDialogRef);
  private ascentsService = inject(AscentsService);
  private scalesService = inject(ScalesService);
  private translateSpecialGrades = inject(TranslateSpecialGradesService);

  gradeLabel = (grade: { name?: string } | null): string =>
    grade?.name ? this.translateSpecialGrades.translate(grade.name) : '';

  constructor() {
    this.line = this.context.line
      ? this.context.line
      : this.context.ascent.line;

    this.scalesService
      .getScale(this.line.type, this.line.gradeScale)
      .subscribe((scale) => {
        this.grades = scale.grades.filter((grade) => grade.value >= 0);
      });
    this.today = new Date();
    this.today.setHours(23, 59, 59, 999);
  }

  ngOnInit() {
    this.buildForm();
    this.gymMode$ = this.store.select(selectGymMode).pipe(take(1));

    this.ascent = this.context.ascent;
    this.ascentForm.disable();
    if (this.ascent) {
      this.editMode = true;
      this.videoFormOpen = !!this.ascent.video?.url;
      this.videoStartOpen =
        (this.ascent.video?.startSeconds ?? 0) > 0 &&
        providerForUrl(this.ascent.video?.url) !== 'instagram';
      this.setFormValue();
    } else {
      this.store
        .select(selectInstanceSettingsState)
        .subscribe((instanceSettings) =>
          this.scalesService
            .gradeNameByValue(
              this.line.type,
              this.line.gradeScale,
              instanceSettings.displayUserGrades
                ? this.line.userGradeValue
                : this.line.authorGradeValue,
            )
            .subscribe((gradeName) => {
              this.ascentForm.patchValue({
                grade: {
                  name: gradeName,
                  value: instanceSettings.displayUserGrades
                    ? this.line.userGradeValue
                    : this.line.authorGradeValue,
                },
              });
              this.ascentForm.enable();
            }),
        );
    }
  }

  private buildForm() {
    this.ascentForm = this.fb.group({
      grade: [null, [Validators.required]],
      rating: [null, [Validators.required]],
      year: [
        new Date(),
        [yearOfDateNotInFutureValidator(), Validators.required],
      ],
      date: [new Date(), [dateNotInFutureValidator(), Validators.required]],
      soft: [false],
      hard: [false],
      fa: [false],
      flash: [false],
      withKneepad: [false],
      comment: [null],
      yearOnly: [false],
      videoUrl: [null, [externalVideoUrlValidator()]],
      videoTitle: [null, [Validators.maxLength(120)]],
      videoStartSeconds: [null, [startSecondsValidator()]],
    });
    this.ascentForm
      .get('videoUrl')
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((url) => {
        if (providerForUrl(url) === 'instagram') {
          this.videoStartOpen = false;
          this.ascentForm
            .get('videoStartSeconds')
            .setValue(null, { emitEvent: false });
        }
      });
    this.ascentForm
      .get('soft')
      .valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((x) => x),
      )
      .subscribe(() => {
        this.ascentForm.get('hard').setValue(false);
      });
    this.ascentForm
      .get('hard')
      .valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((x) => x),
      )
      .subscribe(() => {
        this.ascentForm.get('soft').setValue(false);
      });
    this.store
      .select(selectInstanceSettingsState)
      .subscribe((instanceSettings) =>
        this.ascentForm
          .get('grade')
          .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((newGrade: Grade) => {
            this.gradeDifferenceWarning =
              Math.abs(
                (instanceSettings.displayUserGrades
                  ? this.line.userGradeValue
                  : this.line.authorGradeValue) - newGrade?.value,
              ) >= 3;
          }),
      );
  }

  private setFormValue() {
    this.scalesService
      .gradeNameByValue(
        this.line.type,
        this.line.gradeScale,
        this.ascent.gradeValue,
      )
      .subscribe((gradeName) => {
        this.ascentForm.patchValue({
          grade: {
            name: gradeName,
            value: this.ascent.gradeValue,
          },
          rating: this.ascent.rating,
          hard: this.ascent.hard,
          soft: this.ascent.soft,
          fa: this.ascent.fa,
          flash: this.ascent.flash,
          withKneepad: this.ascent.withKneepad,
          comment: this.ascent.comment,
          videoUrl: this.ascent.video?.url ?? null,
          videoTitle: this.ascent.video?.title ?? null,
          videoStartSeconds:
            providerForUrl(this.ascent.video?.url) === 'instagram'
              ? null
              : (this.ascent.video?.startSeconds ?? null),
          year: this.ascent.year
            ? new Date(this.ascent.year, 1, 1)
            : this.ascent.date,
          date: this.ascent.date
            ? this.ascent.date
            : new Date(this.ascent.year, 1, 1),
          yearOnly: this.ascent.year !== null,
        });
        this.ascentForm.enable();
      });
  }

  public saveAscent() {
    if (this.ascentForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const ascent = new Ascent();
      ascent.gradeValue = this.ascentForm.get('grade').value.value;
      ascent.rating = this.ascentForm.get('rating').value;
      ascent.year = this.ascentForm.get('yearOnly').value
        ? this.ascentForm.get('year').value.getFullYear()
        : null;
      ascent.date = !this.ascentForm.get('yearOnly').value
        ? this.ascentForm.get('date').value
        : null;
      ascent.soft = this.ascentForm.get('soft').value;
      ascent.hard = this.ascentForm.get('hard').value;
      ascent.fa = this.ascentForm.get('fa').value;
      ascent.flash = this.ascentForm.get('flash').value;
      ascent.withKneepad = this.ascentForm.get('withKneepad').value;
      ascent.comment = this.ascentForm.get('comment').value;
      ascent.video = this.ascentVideo();
      ascent.line = this.line;
      if (!this.editMode) {
        this.ascentsService.createAscent(ascent).subscribe(() => {
          this.store.dispatch(toastNotification('ASCENT_ADDED'));
          this.loadingState = LoadingState.DEFAULT;
          this.store.dispatch(
            reloadAfterAscent({ ascendedLineId: this.line.id }),
          );
          this.ref.close();
        });
      } else {
        ascent.id = this.ascent.id;
        this.ascentsService.updateAscent(ascent).subscribe(() => {
          this.store.dispatch(toastNotification('ASCENT_UPDATED'));
          this.loadingState = LoadingState.DEFAULT;
          this.store.dispatch(
            reloadAfterAscent({ ascendedLineId: this.line.id }),
          );
          this.ref.close();
        });
      }
    } else {
      this.formDirective.markAsTouched();
    }
  }

  showVideoForm() {
    this.videoFormOpen = true;
  }

  hideVideoForm() {
    this.videoFormOpen = false;
    this.videoStartOpen = false;
    this.ascentForm.patchValue({
      videoUrl: null,
      videoTitle: null,
      videoStartSeconds: null,
    });
  }

  allowsVideoStart(): boolean {
    return (
      providerForUrl(this.ascentForm.get('videoUrl').value) !== 'instagram'
    );
  }

  showVideoStart() {
    this.videoStartOpen = true;
  }

  hideVideoStart() {
    this.videoStartOpen = false;
    this.ascentForm.patchValue({ videoStartSeconds: null });
  }

  private ascentVideo(): Video | null {
    if (!this.videoFormOpen) {
      return null;
    }
    const url = (this.ascentForm.get('videoUrl').value || '').trim();
    if (!url) {
      return null;
    }
    const title = (this.ascentForm.get('videoTitle').value || '').trim();
    const start =
      this.videoStartOpen && this.allowsVideoStart()
        ? this.ascentForm.get('videoStartSeconds').value
        : null;
    const startSeconds = start === null || start === '' ? null : Number(start);
    return Video.deserialize({
      url,
      title: title || 'Video',
      startSeconds: startSeconds > 0 ? startSeconds : null,
    });
  }

  setToLastSunday() {
    const ref = new Date();
    const lastSunday = subtractLocalCalendarDays(
      ref,
      daysBackToLastSunday(ref),
    );
    this.ascentForm.get('date').setValue(lastSunday);
    this.ascentForm.get('year').setValue(lastSunday);
    this.ascentForm.get('yearOnly').setValue(false);
  }

  setToLastSaturday() {
    const ref = new Date();
    const lastSaturday = subtractLocalCalendarDays(
      ref,
      daysBackToLastSaturday(ref),
    );
    this.ascentForm.get('date').setValue(lastSaturday);
    this.ascentForm.get('year').setValue(lastSaturday);
    this.ascentForm.get('yearOnly').setValue(false);
  }

  setToToday() {
    const today = new Date();
    this.ascentForm.get('date').setValue(today);
    this.ascentForm.get('year').setValue(today);
    this.ascentForm.get('yearOnly').setValue(false);
  }
}
