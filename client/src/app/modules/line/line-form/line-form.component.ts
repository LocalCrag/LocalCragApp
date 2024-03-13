import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {FormDirective} from '../../shared/forms/form.directive';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {LoadingState} from '../../../enums/loading-state';
import {Store} from '@ngrx/store';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslocoService} from '@ngneat/transloco';
import {ConfirmationService} from 'primeng/api';
import {catchError} from 'rxjs/operators';
import {of} from 'rxjs';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';
import {environment} from '../../../../environments/environment';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {Line} from '../../../models/line';
import {LinesService} from '../../../services/crud/lines.service';
import {Grade, GRADES} from '../../../utility/misc/grades';
import {yearOfDateNotInFutureValidator} from '../../../utility/validators/year-not-in-future.validator';
import {httpUrlValidator} from '../../../utility/validators/http-url.validator';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {StartingPosition} from '../../../enums/starting-position';
import {Title} from '@angular/platform-browser';
import {Editor} from 'primeng/editor';
import {clearGradeCache} from '../../../ngrx/actions/cache.actions';

/**
 * Form component for lines.
 */
@Component({
  selector: 'lc-line-form',
  templateUrl: './line-form.component.html',
  styleUrls: ['./line-form.component.scss'],
  providers: [ConfirmationService],
})
@UntilDestroy()
export class LineFormComponent implements OnInit {

  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChild(Editor) editor: Editor;

  public lineForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public line: Line;
  public editMode = false;
  public grades = GRADES.FB;
  public startingPositions = [
    StartingPosition.STAND,
    StartingPosition.SIT,
    StartingPosition.CROUCH,
    StartingPosition.FRENCH,
    StartingPosition.CANDLE
  ]
  public today = new Date();

  private cragSlug: string;
  private sectorSlug: string;
  private areaSlug: string;

  constructor(private fb: FormBuilder,
              private store: Store,
              private title: Title,
              private route: ActivatedRoute,
              private router: Router,
              private linesService: LinesService,
              private translocoService: TranslocoService,
              private confirmationService: ConfirmationService) {
  }

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.buildForm();
    this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    this.sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
    this.areaSlug = this.route.snapshot.paramMap.get('area-slug');
    const lineSlug = this.route.snapshot.paramMap.get('line-slug');
    if (lineSlug) {
      this.editMode = true;
      this.lineForm.disable();
      this.linesService.getLine(lineSlug).pipe(catchError(e => {
        if (e.status === 404) {
          this.router.navigate(['/not-found']);
        }
        return of(e);
      })).subscribe(line => {
        this.line = line;
        this.setFormValue();
        this.loadingState = LoadingState.DEFAULT;
        if (this.editor) {
          this.editor.getQuill().enable();
        }
      });
    } else {
      this.title.setTitle(`${this.translocoService.translate(marker('lineFormBrowserTitle'))} - ${environment.instanceName}`)
      this.loadingState = LoadingState.DEFAULT;
    }
  }

  /**
   * Builds the line form.
   */
  private buildForm() {
    this.lineForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      videos: this.fb.array([]),
      grade: [null, [Validators.required]],
      rating: [null],
      faYear: [null, [yearOfDateNotInFutureValidator()]],
      faName: [null],
      startingPosition: [StartingPosition.STAND, [Validators.required]],
      eliminate: [false],
      traverse: [false],
      highball: [false],
      lowball: [false],
      noTopout: [false],
      badDropzone: [false],
      roof: [false],
      slab: [false],
      vertical: [false],
      overhang: [false],
      athletic: [false],
      technical: [false],
      endurance: [false],
      cruxy: [false],
      dyno: [false],
      jugs: [false],
      sloper: [false],
      crimps: [false],
      pockets: [false],
      pinches: [false],
      crack: [false],
      dihedral: [false],
      compression: [false],
      arete: [false],
      mantle: [false],
    });
    this.lineForm.get('grade').valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.setFormDisabledState();
    });
  }

  setFormDisabledState(){
    if (this.lineForm.get('grade').value?.value < 0) { // Projects can't have ratings or FA info
      this.lineForm.get('faYear').disable();
      this.lineForm.get('faName').disable();
      this.lineForm.get('rating').setValue(null);
      this.lineForm.get('faYear').setValue(null);
      this.lineForm.get('faName').setValue(null);
    } else {
      this.lineForm.get('faYear').enable();
      this.lineForm.get('faName').enable();
    }
  }

  /**
   * Adds a new line video control to the videos form array.
   */
  public addLineVideoFormControl() {
    (this.lineForm.get('videos') as FormArray).push(this.fb.group({
      url: [null, [Validators.required, httpUrlValidator()]],
      title: [this.translocoService.translate(marker('videoTitle')), [Validators.required]]
    }))
  }

  /**
   * Sets the form value based on an input crag and enables the form afterward.
   */
  private setFormValue() {
    this.line.videos.map(video => {
      this.addLineVideoFormControl();
    });
    this.lineForm.patchValue({
      name: this.line.name,
      description: this.line.description,
      videos: this.line.videos,
      grade: this.line.grade,
      rating: this.line.rating,
      faYear: this.line.faYear ? new Date(this.line.faYear, 6, 15) : null,
      faName: this.line.faName,
      startingPosition: this.line.startingPosition,
      eliminate: this.line.eliminate,
      traverse: this.line.traverse,
      highball: this.line.highball,
      lowball: this.line.lowball,
      noTopout: this.line.noTopout,
      badDropzone: this.line.badDropzone,
      roof: this.line.roof,
      slab: this.line.slab,
      vertical: this.line.vertical,
      overhang: this.line.overhang,
      athletic: this.line.athletic,
      technical: this.line.technical,
      endurance: this.line.endurance,
      cruxy: this.line.cruxy,
      dyno: this.line.dyno,
      jugs: this.line.jugs,
      sloper: this.line.sloper,
      crimps: this.line.crimps,
      pockets: this.line.pockets,
      pinches: this.line.pinches,
      crack: this.line.crack,
      dihedral: this.line.dihedral,
      compression: this.line.compression,
      arete: this.line.arete,
      mantle: this.line.mantle,
    });
    this.lineForm.enable();
    this.setFormDisabledState();
  }

  /**
   * Cancels the form.
   */
  cancel() {
    if (this.line) {
      this.router.navigate(['/topo', this.cragSlug, this.sectorSlug, this.areaSlug, this.line.slug]);
    } else {
      this.router.navigate(['/topo', this.cragSlug, this.sectorSlug, this.areaSlug, 'lines']);
    }
  }

  /**
   * Saves the line and navigates to the lines list.
   */
  public saveLine() {
    if (this.lineForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const line = new Line();
      line.name = this.lineForm.get('name').value;
      line.description = this.lineForm.get('description').value;
      line.videos = this.lineForm.get('videos').value;
      line.grade = this.lineForm.get('grade').value;
      line.rating = this.lineForm.get('rating').value;
      line.faYear = this.lineForm.get('faYear').value ? this.lineForm.get('faYear').value.getFullYear() : null;
      line.faName = this.lineForm.get('faName').value;
      line.startingPosition = this.lineForm.get('startingPosition').value;
      line.eliminate = this.lineForm.get('eliminate').value;
      line.traverse = this.lineForm.get('traverse').value;
      line.highball = this.lineForm.get('highball').value;
      line.lowball = this.lineForm.get('lowball').value;
      line.noTopout = this.lineForm.get('noTopout').value;
      line.badDropzone = this.lineForm.get('badDropzone').value;
      line.roof = this.lineForm.get('roof').value;
      line.slab = this.lineForm.get('slab').value;
      line.vertical = this.lineForm.get('vertical').value;
      line.overhang = this.lineForm.get('overhang').value;
      line.athletic = this.lineForm.get('athletic').value;
      line.technical = this.lineForm.get('technical').value;
      line.endurance = this.lineForm.get('endurance').value;
      line.cruxy = this.lineForm.get('cruxy').value;
      line.dyno = this.lineForm.get('dyno').value;
      line.jugs = this.lineForm.get('jugs').value;
      line.sloper = this.lineForm.get('sloper').value;
      line.crimps = this.lineForm.get('crimps').value;
      line.pockets = this.lineForm.get('pockets').value;
      line.pinches = this.lineForm.get('pinches').value;
      line.crack = this.lineForm.get('crack').value;
      line.dihedral = this.lineForm.get('dihedral').value;
      line.compression = this.lineForm.get('compression').value;
      line.arete = this.lineForm.get('arete').value;
      line.mantle = this.lineForm.get('mantle').value;
      if (this.line) {
        line.slug = this.line.slug;
        this.linesService.updateLine(this.areaSlug, line).subscribe(line => {
          this.store.dispatch(toastNotification(NotificationIdentifier.LINE_UPDATED));
          this.router.navigate(['/topo', this.cragSlug, this.sectorSlug, this.areaSlug, line.slug]);
          this.loadingState = LoadingState.DEFAULT;
          this.store.dispatch(clearGradeCache({area: this.areaSlug, crag: this.cragSlug, sector: this.sectorSlug}))
        });
      } else {
        this.linesService.createLine(line, this.areaSlug).subscribe(crag => {
          this.store.dispatch(toastNotification(NotificationIdentifier.LINE_CREATED));
          this.router.navigate(['/topo', this.cragSlug, this.sectorSlug, this.areaSlug, 'lines']);
          this.loadingState = LoadingState.DEFAULT;
          this.store.dispatch(clearGradeCache({area: this.areaSlug, crag: this.cragSlug, sector: this.sectorSlug}))
        });
      }
    } else {
      this.formDirective.markAsTouched();
    }
  }

  /**
   * Asks if the line should really get deleted.
   * @param event Click event.
   */
  confirmDeleteLine(event: Event) {
    this.translocoService.load(`${environment.language}`).subscribe(() => {
      this.confirmationService.confirm({
        target: event.target,
        message: this.translocoService.translate(marker('line.askReallyWantToDeleteLine')),
        acceptLabel: this.translocoService.translate(marker('line.yesDelete')),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(marker('line.noDontDelete')),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.deleteLine();
        },
      });
    });
  }

  /**
   * Deletes the line and navigates to the line list.
   */
  public deleteLine() {
    this.linesService.deleteLine(this.areaSlug, this.line).subscribe(() => {
      this.store.dispatch(toastNotification(NotificationIdentifier.LINE_DELETED));
      this.router.navigate(['/topo', this.cragSlug, this.sectorSlug, this.areaSlug, 'lines']);
      this.loadingState = LoadingState.DEFAULT;
      this.store.dispatch(clearGradeCache({area: this.areaSlug, crag: this.cragSlug, sector: this.sectorSlug}))
    });
  }

  /**
   * Deletes the line video form control at the given index from the videos form array.
   * @param index Index of the control in the array.
   */
  public deleteLineVideoControl(index: number) {
    (this.lineForm.get('videos') as FormArray).removeAt(index)
  }


}
