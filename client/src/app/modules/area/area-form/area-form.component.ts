import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
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
import { SectorsService } from '../../../services/crud/sectors.service';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { catchError, switchMap } from 'rxjs/operators';
import { EMPTY, forkJoin, Observable, throwError } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Area } from '../../../models/area';
import { Sector } from '../../../models/sector';
import { Line } from '../../../models/line';
import { TopoImage } from '../../../models/topo-image';
import { AreasService } from '../../../services/crud/areas.service';
import { Title } from '@angular/platform-browser';
import { WysiwygEditorComponent } from '../../shared/components/wysiwyg-editor/wysiwyg-editor.component';
import { UploadService } from '../../../services/crud/upload.service';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import {
  disabledMarkerTypesArea,
  MapMarkerType,
} from '../../../enums/map-marker-type';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { MapMarkerFormArrayComponent } from '../../maps/map-marker-form-array/map-marker-form-array.component';
import { FormSkeletonComponent } from '../../shared/components/form-skeleton/form-skeleton.component';
import { SingleImageUploadComponent } from '../../shared/forms/controls/single-image-upload/single-image-upload.component';
import { condicasterCragIdValidator } from '../../../utility/validators/condicaster.validators';
import { CondicasterEnabledDirective } from '../../shared/directives/condicaster-enabled.directive';
import { OutdoorModeDirective } from '../../shared/directives/outdoor-mode.directive';
import { MoveObjectDialogComponent } from '../../shared/components/move-object-dialog/move-object-dialog.component';
import { environment } from '../../../../environments/environment';
import { ScheduledClosureFormComponent } from '../../shared/components/scheduled-closure-form/scheduled-closure-form.component';
import { ClosureState } from '../../../models/closure-state';
import { ClosureStateService } from '../../../services/crud/closure-state.service';
import { PageTitleService } from '../../../services/core/page-title.service';
import { DuplicateNameWarningComponent } from '../../shared/components/duplicate-name-warning/duplicate-name-warning.component';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeftRight,
  lucideBan,
  lucideCircleQuestionMark,
  lucideInfo,
  lucideSave,
  lucideTrash2,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.service';
import { LoadingButtonComponent } from '../../shared/components/loading-button/loading-button.component';
import {
  CondicasterCragLink,
  CondicasterCragLinkComponent,
} from '../../shared/components/condicaster-crag-link/condicaster-crag-link.component';
import { Coordinates } from '../../../interfaces/coordinates.interface';

/**
 * Form component for creating and editing areas.
 */
@Component({
  selector: 'lc-area-form',
  templateUrl: './area-form.component.html',
  styleUrls: ['./area-form.component.scss'],
  providers: [
    provideIcons({
      lucideArrowLeftRight,
      lucideBan,
      lucideCircleQuestionMark,
      lucideInfo,
      lucideSave,
      lucideTrash2,
      lucideTriangleAlert,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    LoadingButtonComponent,
    TranslocoDirective,
    ReactiveFormsModule,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    WysiwygEditorComponent,
    MapMarkerFormArrayComponent,
    TranslocoPipe,
    FormSkeletonComponent,
    SingleImageUploadComponent,
    OutdoorModeDirective,
    CondicasterEnabledDirective,
    MoveObjectDialogComponent,
    ScheduledClosureFormComponent,
    DuplicateNameWarningComponent,
    CondicasterCragLinkComponent,
    HlmButton,
    HlmAlert,
    HlmAlertDescription,
    HlmInput,
    HlmCheckbox,
    HlmTooltip,
    NgIcon,
  ],
})
export class AreaFormComponent implements OnInit {
  private confirmDialog = inject(ConfirmDialogService);
  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChild('moveDialog') moveDialog: MoveObjectDialogComponent;

  public areaForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public area: Area;
  public editMode = false;
  public parentSector: Sector;
  public parentClosureState: ClosureState | null = null;

  private cragSlug: string;
  private sectorSlug: string;
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private areasService = inject(AreasService);
  private sectorsService = inject(SectorsService);
  private uploadService = inject(UploadService);
  private title = inject(Title);
  private translocoService = inject(TranslocoService);
  private closureStateService = inject(ClosureStateService);
  private pageTitleService = inject(PageTitleService);

  public findAreasByName = (
    name: string,
    excludeId: string | null = null,
  ): Observable<Area[]> => this.areasService.findByName(name, excludeId);

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    this.sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
    const areaSlug = this.route.snapshot.paramMap.get('area-slug');

    forkJoin([
      this.sectorsService.getSector(this.sectorSlug),
      this.closureStateService.getSectorClosureState(this.sectorSlug),
    ]).subscribe(([sector, parentClosureState]) => {
      this.parentSector = sector;
      this.parentClosureState = parentClosureState;
      this.buildForm();
      if (areaSlug) {
        this.editMode = true;
        this.setPageTitle();
        this.areaForm.disable();
        this.areasService
          .getArea(areaSlug)
          .pipe(
            catchError((e) => {
              if (e.status === 404) {
                this.router.navigate(['/not-found']);
                return EMPTY;
              }
              return throwError(() => e);
            }),
          )
          .subscribe((area) => {
            this.area = area;
            this.setFormValue();
            this.loadingState = LoadingState.DEFAULT;
          });
      } else {
        this.setPageTitle();
        this.store.select(selectInstanceName).subscribe((instanceName) => {
          this.title.setTitle(
            `${this.translocoService.translate(marker('areaFormBrowserTitle'))} - ${instanceName}`,
          );
        });
        this.areaForm.get('secret').setValue(this.parentSector.secret);
        this.loadingState = LoadingState.DEFAULT;
      }
    });
  }

  /** t(area.areaForm.editAreaTitle, area.areaForm.createAreaTitle) */
  private setPageTitle(): void {
    this.pageTitleService.setTitle(
      this.translocoService.translate(
        this.editMode
          ? 'area.areaForm.editAreaTitle'
          : 'area.areaForm.createAreaTitle',
      ),
    );
  }

  /**
   * Builds the area form.
   */
  private buildForm() {
    this.areaForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      description: [null],
      shortDescription: [null],
      portraitImage: [null],
      secret: [false],
      mapMarkers: [[]],
      condicasterCragId: [null, [condicasterCragIdValidator]],
      condicasterCragName: [null],
      closureSchedules: [[]],
    });
  }

  /**
   * Sets the form value based on an input sector and enables the form afterwards.
   */
  private setFormValue() {
    this.areaForm.enable();
    this.areaForm.patchValue({
      name: this.area.name,
      description: this.area.description,
      shortDescription: this.area.shortDescription,
      portraitImage: this.area.portraitImage,
      secret: this.area.secret,
      mapMarkers: this.area.mapMarkers,
      condicasterCragId: this.area.condicasterCragId,
      condicasterCragName: this.area.condicasterCragName,
      closureSchedules: this.area.closureSchedules ?? [],
    });
  }

  /**
   * Cancels the form.
   */
  cancel() {
    if (this.area) {
      this.router.navigate([
        '/topo',
        this.cragSlug,
        this.sectorSlug,
        this.area.slug,
      ]);
    } else {
      this.router.navigate(['/topo', this.cragSlug, this.sectorSlug, 'areas']);
    }
  }

  /**
   * Saves the area and navigates to the area list.
   */
  public saveArea() {
    if (this.areaForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const area = new Area();
      area.name = this.areaForm.get('name').value;
      area.description = this.areaForm.get('description').value;
      area.shortDescription = this.areaForm.get('shortDescription').value;
      area.portraitImage = this.areaForm.get('portraitImage').value;
      area.secret = this.areaForm.get('secret').value;
      area.mapMarkers = this.areaForm.get('mapMarkers').value;
      area.closureSchedules = this.areaForm.get('closureSchedules').value ?? [];
      const condicasterCragId = this.areaForm.get('condicasterCragId').value;
      area.condicasterCragId =
        condicasterCragId === null || condicasterCragId === ''
          ? null
          : Number(condicasterCragId);
      area.condicasterCragName = area.condicasterCragId
        ? this.areaForm.get('condicasterCragName').value || null
        : null;
      if (this.area) {
        area.slug = this.area.slug;
        this.uploadService
          .saveFileFocusIfChanged(area.portraitImage)
          .pipe(switchMap(() => this.areasService.updateArea(area)))
          .subscribe((area) => {
            this.store.dispatch(toastNotification('AREA_UPDATED'));
            this.router.navigate([
              '/topo',
              this.cragSlug,
              this.sectorSlug,
              area.slug,
            ]);
            this.loadingState = LoadingState.DEFAULT;
          });
      } else {
        this.uploadService
          .saveFileFocusIfChanged(area.portraitImage)
          .pipe(
            switchMap(() =>
              this.areasService.createArea(area, this.sectorSlug),
            ),
          )
          .subscribe(() => {
            this.store.dispatch(toastNotification('AREA_CREATED'));
            this.router.navigate([
              '/topo',
              this.cragSlug,
              this.sectorSlug,
              'areas',
            ]);
            this.loadingState = LoadingState.DEFAULT;
          });
      }
    } else {
      this.formDirective.markAsTouched();
    }
  }

  /**
   * Asks if the area should really get deleted.
   * @param event Click event.
   */
  confirmDeleteArea(_event: Event) {
    this.confirmDialog.open({
      message: this.translocoService.translate(
        marker('area.askReallyWantToDeleteArea'),
      ),
      acceptLabel: this.translocoService.translate(marker('area.yesDelete')),
      rejectLabel: this.translocoService.translate(marker('area.noDontDelete')),
      accept: () => {
        this.deleteArea();
      },
      destructive: true,
    });
  }

  /**
   * Deletes the area and navigates to the area list.
   */
  public deleteArea() {
    this.areasService.deleteArea(this.area).subscribe(() => {
      this.store.dispatch(toastNotification('AREA_DELETED'));
      this.router.navigate(['/topo', this.cragSlug, this.sectorSlug, 'areas']);
      this.loadingState = LoadingState.DEFAULT;
    });
  }

  protected markerCoordinates(): Coordinates | null {
    const markers = this.areaForm?.get('mapMarkers')?.value as
      { coordinates?: Coordinates }[] | null;
    return markers?.find((marker) => marker?.coordinates)?.coordinates ?? null;
  }

  protected setCondicasterCrag(link: CondicasterCragLink | null): void {
    this.areaForm.patchValue({
      condicasterCragId: link?.cragId ?? null,
      condicasterCragName: link?.name ?? null,
    });
  }

  protected readonly disabledMarkerTypesArea = disabledMarkerTypesArea;
  protected readonly MapMarkerType = MapMarkerType;

  openMoveDialog() {
    this.moveDialog.open(this.area, this.parentSector.id);
  }

  onObjectMoved(obj: Sector | Area | Line | TopoImage) {
    this.router.navigate([(obj as Area).routerLink]);
  }

  protected readonly environment = environment;
}
