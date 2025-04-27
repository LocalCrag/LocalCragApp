import { Component, OnInit, ViewChild } from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingState } from '../../../enums/loading-state';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { environment } from '../../../../environments/environment';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Line } from '../../../models/line';
import { LinesService } from '../../../services/crud/lines.service';
import { yearOfDateNotInFutureValidator } from '../../../utility/validators/year-not-in-future.validator';
import { httpUrlValidator } from '../../../utility/validators/http-url.validator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { StartingPosition } from '../../../enums/starting-position';
import { Title } from '@angular/platform-browser';
import { Editor } from 'primeng/editor';
import {
  selectInstanceName,
  selectInstanceSettingsState,
} from '../../../ngrx/selectors/instance-settings.selectors';
import { AreasService } from '../../../services/crud/areas.service';
import { ScalesService } from '../../../services/crud/scales.service';
import { LineType } from '../../../enums/line-type';
import { Crag } from '../../../models/crag';
import { Sector } from '../../../models/sector';
import { Area } from '../../../models/area';
import { SectorsService } from '../../../services/crud/sectors.service';
import { CragsService } from '../../../services/crud/crags.service';
import { Scale } from '../../../models/scale';

/**
 * Form component for lines.
 */
@Component({
  selector: 'lc-line-form',
  templateUrl: './line-form.component.html',
  styleUrls: ['./line-form.component.scss'],
  providers: [ConfirmationService],
  standalone: false,
})
@UntilDestroy()
export class LineFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChild(Editor) editor: Editor;

  public lineForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;

  public crag: Crag;
  public sector: Sector;
  public area: Area;

  public line: Line;
  public editMode = false;
  public grades = null;
  public startingPositions = [
    StartingPosition.STAND,
    StartingPosition.SIT,
    StartingPosition.CROUCH,
    StartingPosition.FRENCH,
    StartingPosition.CANDLE,
  ];
  public today = new Date();
  public parentSecret = false;
  public parentClosed = false;

  public groupedScales: Record<LineType, Scale[]> = null;

  public defaultScales: Record<LineType, string | null> = {
    [LineType.BOULDER]: null,
    [LineType.SPORT]: null,
    [LineType.TRAD]: null,
  };

  public typeOptions = null;
  public scaleOptions = null;

  private cragSlug: string;
  private sectorSlug: string;
  private areaSlug: string;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private title: Title,
    private route: ActivatedRoute,
    private router: Router,
    private linesService: LinesService,
    private areasService: AreasService,
    private sectorsService: SectorsService,
    private cragsService: CragsService,
    private translocoService: TranslocoService,
    private confirmationService: ConfirmationService,
    private scalesService: ScalesService,
  ) {}

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    this.sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
    this.areaSlug = this.route.snapshot.paramMap.get('area-slug');
    const lineSlug = this.route.snapshot.paramMap.get('line-slug');

    forkJoin([
      this.cragsService.getCrag(this.cragSlug),
      this.sectorsService.getSector(this.sectorSlug),
      this.areasService.getArea(this.areaSlug),
      this.scalesService.getScales(),
    ]).subscribe(([crag, sector, area, scales]) => {
      this.parentSecret = area.secret;
      this.parentClosed = area.closed;

      this.groupedScales = {
        [LineType.BOULDER]: [],
        [LineType.SPORT]: [],
        [LineType.TRAD]: [],
      };
      scales
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((scale) => this.groupedScales[scale.lineType].push(scale));

      this.defaultScales[LineType.BOULDER] =
        area.defaultBoulderScale ??
        sector.defaultBoulderScale ??
        crag.defaultBoulderScale;
      this.defaultScales[LineType.SPORT] =
        area.defaultSportScale ??
        sector.defaultSportScale ??
        crag.defaultSportScale;
      this.defaultScales[LineType.TRAD] =
        area.defaultTradScale ??
        sector.defaultTradScale ??
        crag.defaultTradScale;

      this.typeOptions = Object.entries(this.groupedScales)
        .filter(([_, v]) => v.length > 0)
        .map(([k]) => ({
          label: this.translocoService.translate(k),
          value: k,
        }));

      this.buildForm();
      this.lineForm
        .get('type')
        .valueChanges.pipe(untilDestroyed(this))
        .subscribe((item) => {
          this.scaleOptions = this.groupedScales[item].map((scale) => ({
            label: scale.name,
            value: scale.name,
          }));
          this.lineForm
            .get('scale')
            .setValue(this.defaultScales[item] ?? this.scaleOptions[0].value);
        });
      this.lineForm
        .get('scale')
        .valueChanges.pipe(untilDestroyed(this))
        .subscribe((item) => {
          if (this.editMode) return;

          this.scalesService
            .getScale(this.lineForm.get('type').value, item)
            .subscribe((scale) => {
              this.grades = scale.grades;
              if (this.line?.ascentCount > 0) {
                this.grades = this.grades.filter((grade) => grade.value >= 0);
              }
              if (!this.line || this.line.type != item) {
                this.lineForm.get('grade').reset();
              } else {
                this.lineForm
                  .get('grade')
                  .setValue(
                    this.grades.filter(
                      (g) => g.value == this.line.gradeValue,
                    )[0],
                  );
              }
            });
        });

      if (lineSlug) {
        this.editMode = true;
        this.lineForm.disable();
        this.linesService
          .getLine(lineSlug)
          .pipe(
            catchError((e) => {
              if (e.status === 404) {
                this.router.navigate(['/not-found']);
              }
              return of(e);
            }),
          )
          .subscribe((line) => {
            this.line = line;
            this.typeOptions = [
              {
                label: this.translocoService.translate(this.line.type),
                value: this.line.type,
              },
            ];
            // find() must always find a result if the backend state is not corrupted
            const scale = this.groupedScales[this.line.type].find(
              (scale) => scale.name == this.line.gradeScale,
            );
            this.scaleOptions = [{ label: scale.name, value: scale.name }];
            this.grades = scale.grades;
            if (this.line?.ascentCount > 0) {
              this.grades = this.grades.filter((grade) => grade.value >= 0);
            }

            this.setFormValue();
            this.loadingState = LoadingState.DEFAULT;
            if (this.editor) {
              this.editor.getQuill().enable();
            }
          });
      } else {
        this.store.select(selectInstanceName).subscribe((instanceName) => {
          this.title.setTitle(
            `${this.translocoService.translate(marker('lineFormBrowserTitle'))} - ${instanceName}`,
          );
        });
        this.lineForm.get('secret').setValue(this.parentSecret);
        this.lineForm.get('type').setValue(LineType.BOULDER);
        this.loadingState = LoadingState.DEFAULT;
      }
    });
  }

  /**
   * Builds the line form.
   */
  private buildForm() {
    this.store
      .select(selectInstanceSettingsState)
      .subscribe((instanceSettings) => {
        this.lineForm = this.fb.group({
          name: ['', [Validators.required, Validators.maxLength(120)]],
          description: [null],
          color: [
            instanceSettings.gymMode ? instanceSettings.arrowColor : null,
          ],
          videos: this.fb.array([]),
          type: [LineType.BOULDER, [Validators.required]],
          scale: [
            this.groupedScales[LineType.BOULDER][0],
            [Validators.required],
          ],
          grade: [null, [Validators.required]],
          rating: [null],
          faYear: [null, [yearOfDateNotInFutureValidator()]],
          faName: [null, [Validators.maxLength(120)]],
          startingPosition: [StartingPosition.STAND, [Validators.required]],
          eliminate: [false],
          traverse: [false],
          highball: [false],
          lowball: [false],
          morpho: [false],
          noTopout: [false],
          badDropzone: [false],
          childFriendly: [false],
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
          secret: [false],
          closed: [false],
          closedReason: [null],
        });

        this.lineForm
          .get('grade')
          .valueChanges.pipe(untilDestroyed(this))
          .subscribe(() => {
            this.setFormDisabledState();
          });
        this.lineForm
          .get('closed')
          .valueChanges.pipe(untilDestroyed(this))
          .subscribe((closed) => {
            if (!closed) {
              this.lineForm.get('closedReason').setValue(null);
            }
          });
      });
  }

  setFormDisabledState() {
    if (this.lineForm.get('grade').value?.value < 0) {
      // Projects can't have ratings or FA info
      this.lineForm.get('faYear').disable();
      this.lineForm.get('faName').disable();
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
    (this.lineForm.get('videos') as FormArray).push(
      this.fb.group({
        url: [null, [Validators.required, httpUrlValidator()]],
        title: [
          this.translocoService.translate(marker('videoTitle')),
          [Validators.required],
        ],
      }),
    );
  }

  /**
   * Sets the form value based on an input crag and enables the form afterward.
   */
  private setFormValue() {
    this.line.videos.map(() => {
      this.addLineVideoFormControl();
    });
    this.lineForm.patchValue({
      name: this.line.name,
      description: this.line.description,
      videos: this.line.videos,
      type: this.line.type,
      scale: this.line.gradeScale,
      grade: this.line.gradeValue,
      color: this.line.color,
      rating: this.line.rating,
      faYear: this.line.faYear ? new Date(this.line.faYear, 6, 15) : null,
      faName: this.line.faName,
      startingPosition: this.line.startingPosition,
      eliminate: this.line.eliminate,
      traverse: this.line.traverse,
      highball: this.line.highball,
      lowball: this.line.lowball,
      morpho: this.line.morpho,
      noTopout: this.line.noTopout,
      badDropzone: this.line.badDropzone,
      childFriendly: this.line.childFriendly,
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
      secret: this.line.secret,
      closed: this.line.closed,
      closedReason: this.line.closedReason,
    });
    this.lineForm.enable();
    this.setFormDisabledState();
  }

  /**
   * Cancels the form.
   */
  cancel() {
    if (this.line) {
      this.router.navigate([
        '/topo',
        this.cragSlug,
        this.sectorSlug,
        this.areaSlug,
        this.line.slug,
      ]);
    } else {
      this.router.navigate([
        '/topo',
        this.cragSlug,
        this.sectorSlug,
        this.areaSlug,
        'lines',
      ]);
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
      line.color = this.lineForm.get('color').value;
      line.videos = this.lineForm.get('videos').value;
      line.type = this.lineForm.get('type').value;
      line.gradeValue = this.lineForm.get('grade').value;
      line.gradeScale = this.lineForm.get('scale').value;
      line.rating = this.lineForm.get('rating').value;
      line.faYear = this.lineForm.get('faYear').value
        ? this.lineForm.get('faYear').value.getFullYear()
        : null;
      line.faName = this.lineForm.get('faName').value;
      line.startingPosition = this.lineForm.get('startingPosition').value;
      line.eliminate = this.lineForm.get('eliminate').value;
      line.traverse = this.lineForm.get('traverse').value;
      line.highball = this.lineForm.get('highball').value;
      line.lowball = this.lineForm.get('lowball').value;
      line.morpho = this.lineForm.get('morpho').value;
      line.noTopout = this.lineForm.get('noTopout').value;
      line.badDropzone = this.lineForm.get('badDropzone').value;
      line.childFriendly = this.lineForm.get('childFriendly').value;
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
      line.secret = this.lineForm.get('secret').value;
      line.closed = this.lineForm.get('closed').value;
      line.closedReason = this.lineForm.get('closedReason').value;
      if (this.line) {
        line.slug = this.line.slug;
        this.linesService.updateLine(line).subscribe((line) => {
          this.store.dispatch(toastNotification('LINE_UPDATED'));
          this.router.navigate([
            '/topo',
            this.cragSlug,
            this.sectorSlug,
            this.areaSlug,
            line.slug,
          ]);
          this.loadingState = LoadingState.DEFAULT;
        });
      } else {
        this.linesService.createLine(line, this.areaSlug).subscribe(() => {
          this.store.dispatch(toastNotification('LINE_CREATED'));
          this.router.navigate([
            '/topo',
            this.cragSlug,
            this.sectorSlug,
            this.areaSlug,
            'lines',
          ]);
          this.loadingState = LoadingState.DEFAULT;
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
        message: this.translocoService.translate(
          marker('line.askReallyWantToDeleteLine'),
        ),
        acceptLabel: this.translocoService.translate(marker('line.yesDelete')),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(
          marker('line.noDontDelete'),
        ),
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
    this.linesService.deleteLine(this.line).subscribe(() => {
      this.store.dispatch(toastNotification('LINE_DELETED'));
      this.router.navigate([
        '/topo',
        this.cragSlug,
        this.sectorSlug,
        this.areaSlug,
        'lines',
      ]);
      this.loadingState = LoadingState.DEFAULT;
    });
  }

  /**
   * Deletes the line video form control at the given index from the videos form array.
   * @param index Index of the control in the array.
   */
  public deleteLineVideoControl(index: number) {
    (this.lineForm.get('videos') as FormArray).removeAt(index);
  }

  protected readonly LineType = LineType;
}
