import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoadingState } from '../../../enums/loading-state';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { catchError, map, switchMap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { environment } from '../../../../environments/environment';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Sector } from '../../../models/sector';
import { Area } from '../../../models/area';
import { Line } from '../../../models/line';
import { TopoImage } from '../../../models/topo-image';
import { SectorsService } from '../../../services/crud/sectors.service';
import { Title } from '@angular/platform-browser';
import { Editor } from 'primeng/editor';
import { UploadService } from '../../../services/crud/upload.service';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { CragsService } from '../../../services/crud/crags.service';
import {
  disabledMarkerTypesSector,
  MapMarkerType,
} from '../../../enums/map-marker-type';

import { ScalesService } from '../../../services/crud/scales.service';
import { LineType } from '../../../enums/line-type';

import { InputText } from 'primeng/inputtext';
import { MapMarkerFormArrayComponent } from '../../maps/map-marker-form-array/map-marker-form-array.component';
import { Checkbox } from 'primeng/checkbox';
import { Select } from 'primeng/select';
import { Message } from 'primeng/message';
import { Button } from 'primeng/button';
import { ConfirmPopup } from 'primeng/confirmpopup';
import { FormSkeletonComponent } from '../../shared/components/form-skeleton/form-skeleton.component';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { SingleImageUploadComponent } from '../../shared/forms/controls/single-image-upload/single-image-upload.component';
import { blocweatherUrlValidator } from '../../../utility/validators/blocweather.validators';
import { Tooltip } from 'primeng/tooltip';
import { OutdoorModeDirective } from '../../shared/directives/outdoor-mode.directive';
import { MoveObjectDialogComponent } from '../../shared/components/move-object-dialog/move-object-dialog.component';
import { Crag } from '../../../models/crag';
import { ScheduledClosureFormComponent } from '../../shared/components/scheduled-closure-form/scheduled-closure-form.component';
import { ClosureState } from '../../../models/closure-state';
import { ClosureStateService } from '../../../services/crud/closure-state.service';
import { PageTitleService } from '../../../services/core/page-title.service';

/**
 * Form component for creating and editing sectors.
 */
@Component({
  selector: 'lc-sector-form',
  templateUrl: './sector-form.component.html',
  styleUrls: ['./sector-form.component.scss'],
  providers: [ConfirmationService],
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    InputText,
    Editor,
    MapMarkerFormArrayComponent,
    Checkbox,
    TranslocoPipe,
    Select,
    Message,
    Button,
    ConfirmPopup,
    FormSkeletonComponent,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    SingleImageUploadComponent,
    Tooltip,
    OutdoorModeDirective,
    MoveObjectDialogComponent,
    ScheduledClosureFormComponent,
  ],
})
export class SectorFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChildren(Editor) editors: QueryList<Editor>;
  @ViewChild('moveDialog') moveDialog: MoveObjectDialogComponent;

  public sectorForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public sector: Sector;
  public editMode = false;
  public boulderScales: SelectItem<string | null>[] = [];
  public sportScales: SelectItem<string | null>[] = [];
  public tradScales: SelectItem<string | null>[] = [];
  public quillModules: any;
  public parentCrag: Crag;
  public parentClosureState: ClosureState | null = null;

  private cragSlug: string;
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private title = inject(Title);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sectorsService = inject(SectorsService);
  private cragsService = inject(CragsService);
  private uploadService = inject(UploadService);
  private translocoService = inject(TranslocoService);
  private confirmationService = inject(ConfirmationService);
  private scalesService = inject(ScalesService);
  private closureStateService = inject(ClosureStateService);
  private pageTitleService = inject(PageTitleService);

  constructor() {
    this.quillModules = this.uploadService.getQuillFileUploadModules();
  }

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    const scalesPopulated = this.scalesService
      .getFormScaleSelectors([
        {
          label: this.translocoService.translate(marker('defaultScalesLabel')),
          value: null,
        },
      ])
      .pipe(
        map((groupedScales) => {
          this.boulderScales = groupedScales[LineType.BOULDER];
          this.sportScales = groupedScales[LineType.SPORT];
          this.tradScales = groupedScales[LineType.TRAD];
          return true;
        }),
      );

    this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    const sectorSlug = this.route.snapshot.paramMap.get('sector-slug');

    forkJoin([
      this.cragsService.getCrag(this.cragSlug),
      this.closureStateService.getCragClosureState(this.cragSlug),
    ]).subscribe(([crag, parentClosureState]) => {
      this.parentCrag = crag;
      this.parentClosureState = parentClosureState;
      this.buildForm();
      if (sectorSlug) {
        this.editMode = true;
        this.setPageTitle();
        this.sectorForm.disable();
        forkJoin([
          this.sectorsService.getSector(sectorSlug).pipe(
            catchError((e) => {
              if (e.status === 404) {
                this.router.navigate(['/not-found']);
              }
              return of(e);
            }),
          ),
          scalesPopulated,
        ]).subscribe(([sector, _]) => {
          this.sector = sector;
          this.setFormValue();
          this.loadingState = LoadingState.DEFAULT;
          this.editors?.map((editor) => {
            editor.getQuill()?.enable();
          });
        });
      } else {
        this.setPageTitle();
        this.store.select(selectInstanceName).subscribe((instanceName) => {
          this.title.setTitle(
            `${this.translocoService.translate(marker('sectorFormBrowserTitle'))} - ${instanceName}`,
          );
        });
        this.sectorForm.disable();
        scalesPopulated.subscribe(() => {
          this.sectorForm.get('secret').setValue(this.parentCrag.secret);
          this.sectorForm.enable();
          this.loadingState = LoadingState.DEFAULT;
        });
      }
    });
  }

  /** t(sector.sectorForm.editSectorTitle, sector.sectorForm.createSectorTitle) */
  private setPageTitle(): void {
    this.pageTitleService.setTitle(
      this.translocoService.translate(
        this.editMode
          ? 'sector.sectorForm.editSectorTitle'
          : 'sector.sectorForm.createSectorTitle',
      ),
    );
  }

  /**
   * Builds the crag form.
   */
  private buildForm() {
    this.sectorForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      description: [null],
      shortDescription: [null],
      portraitImage: [null],
      rules: [null],
      secret: [false],
      mapMarkers: [[]],
      defaultBoulderScale: [null],
      defaultSportScale: [null],
      defaultTradScale: [null],
      blocweatherUrl: [
        null,
        [blocweatherUrlValidator, Validators.maxLength(255)],
      ],
      closureSchedules: [[]],
    });
  }

  /**
   * Sets the form value based on an input sector and enables the form afterwards.
   */
  private setFormValue() {
    this.sectorForm.enable();
    this.sectorForm.patchValue({
      name: this.sector.name,
      description: this.sector.description,
      shortDescription: this.sector.shortDescription,
      portraitImage: this.sector.portraitImage,
      rules: this.sector.rules,
      secret: this.sector.secret,
      mapMarkers: this.sector.mapMarkers,
      defaultBoulderScale: this.sector.defaultBoulderScale,
      defaultSportScale: this.sector.defaultSportScale,
      defaultTradScale: this.sector.defaultTradScale,
      blocweatherUrl: this.sector.blocweatherUrl,
      closureSchedules: this.sector.closureSchedules ?? [],
    });
  }

  /**
   * Cancels the form.
   */
  cancel() {
    if (this.sector) {
      this.router.navigate(['/topo', this.cragSlug, this.sector.slug]);
    } else {
      this.router.navigate(['/topo', this.cragSlug, 'sectors']);
    }
  }

  /**
   * Saves the sector and navigates to the sector list.
   */
  public saveCrag() {
    if (this.sectorForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const sector = new Sector();
      sector.name = this.sectorForm.get('name').value;
      sector.description = this.sectorForm.get('description').value;
      sector.shortDescription = this.sectorForm.get('shortDescription').value;
      sector.rules = this.sectorForm.get('rules').value;
      sector.portraitImage = this.sectorForm.get('portraitImage').value;
      sector.secret = this.sectorForm.get('secret').value;
      sector.mapMarkers = this.sectorForm.get('mapMarkers').value;
      sector.closureSchedules =
        this.sectorForm.get('closureSchedules').value ?? [];
      sector.defaultBoulderScale = this.sectorForm.get(
        'defaultBoulderScale',
      ).value;
      sector.defaultSportScale = this.sectorForm.get('defaultSportScale').value;
      sector.defaultTradScale = this.sectorForm.get('defaultTradScale').value;
      sector.blocweatherUrl =
        this.sectorForm.get('blocweatherUrl').value || null;
      if (this.sector) {
        sector.slug = this.sector.slug;
        this.uploadService
          .saveFileFocusIfChanged(
            sector.portraitImage,
            this.sector.portraitImage?.focusY,
          )
          .pipe(switchMap(() => this.sectorsService.updateSector(sector)))
          .subscribe((sector) => {
            this.store.dispatch(toastNotification('SECTOR_UPDATED'));
            this.router.navigate(['/topo', this.cragSlug, sector.slug]);
            this.loadingState = LoadingState.DEFAULT;
          });
      } else {
        this.uploadService
          .saveFileFocusIfChanged(sector.portraitImage, null)
          .pipe(
            switchMap(() =>
              this.sectorsService.createSector(sector, this.cragSlug),
            ),
          )
          .subscribe(() => {
            this.store.dispatch(toastNotification('SECTOR_CREATED'));
            this.router.navigate(['/topo', this.cragSlug, 'sectors']);
            this.loadingState = LoadingState.DEFAULT;
          });
      }
    } else {
      this.formDirective.markAsTouched();
    }
  }

  /**
   * Asks if the sector should really get deleted.
   * @param event Click event.
   */
  confirmDeleteSector(event: Event) {
    this.confirmationService.confirm({
      target: event.target,
      message: this.translocoService.translate(
        marker('sector.askReallyWantToDeleteSector'),
      ),
      acceptLabel: this.translocoService.translate(marker('sector.yesDelete')),
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: this.translocoService.translate(
        marker('sector.noDontDelete'),
      ),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteSector();
      },
    });
  }

  /**
   * Deletes the sector and navigates to the sector list.
   */
  public deleteSector() {
    this.sectorsService.deleteSector(this.sector).subscribe(() => {
      this.store.dispatch(toastNotification('SECTOR_DELETED'));
      this.router.navigate(['/topo', this.cragSlug, 'sectors']);
      this.loadingState = LoadingState.DEFAULT;
    });
  }

  protected readonly disabledMarkerTypesSector = disabledMarkerTypesSector;
  protected readonly MapMarkerType = MapMarkerType;
  protected readonly environment = environment;

  openMoveDialog() {
    this.moveDialog.open(this.sector, this.parentCrag.id);
  }

  onObjectMoved(obj: Sector | Area | Line | TopoImage) {
    this.router.navigate([(obj as Sector).routerLink]);
  }
}
