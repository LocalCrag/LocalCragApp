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
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { catchError, switchMap } from 'rxjs/operators';
import { EMPTY, forkJoin, Observable, throwError } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { environment } from '../../../../environments/environment';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Sector } from '../../../models/sector';
import { Area } from '../../../models/area';
import { Line } from '../../../models/line';
import { TopoImage } from '../../../models/topo-image';
import { SectorsService } from '../../../services/crud/sectors.service';
import { Title } from '@angular/platform-browser';
import { WysiwygEditorComponent } from '../../shared/components/wysiwyg-editor/wysiwyg-editor.component';
import { UploadService } from '../../../services/crud/upload.service';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { CragsService } from '../../../services/crud/crags.service';
import {
  disabledMarkerTypesSector,
  MapMarkerType,
} from '../../../enums/map-marker-type';
import { MapMarkerFormArrayComponent } from '../../maps/map-marker-form-array/map-marker-form-array.component';
import { FormSkeletonComponent } from '../../shared/components/form-skeleton/form-skeleton.component';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { SingleImageUploadComponent } from '../../shared/forms/controls/single-image-upload/single-image-upload.component';
import { condicasterCragIdValidator } from '../../../utility/validators/condicaster.validators';
import { CondicasterEnabledDirective } from '../../shared/directives/condicaster-enabled.directive';
import { OutdoorModeDirective } from '../../shared/directives/outdoor-mode.directive';
import { MoveObjectDialogComponent } from '../../shared/components/move-object-dialog/move-object-dialog.component';
import { Crag } from '../../../models/crag';
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
 * Form component for creating and editing sectors.
 */
@Component({
  selector: 'lc-sector-form',
  templateUrl: './sector-form.component.html',
  styleUrls: ['./sector-form.component.scss'],
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
    WysiwygEditorComponent,
    MapMarkerFormArrayComponent,
    TranslocoPipe,
    FormSkeletonComponent,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
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
export class SectorFormComponent implements OnInit {
  private confirmDialog = inject(ConfirmDialogService);
  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChild('moveDialog') moveDialog: MoveObjectDialogComponent;

  public sectorForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public sector: Sector;
  public editMode = false;
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
  private closureStateService = inject(ClosureStateService);
  private pageTitleService = inject(PageTitleService);

  public findSectorsByName = (
    name: string,
    excludeId: string | null = null,
  ): Observable<Sector[]> => this.sectorsService.findByName(name, excludeId);

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
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
        this.sectorsService
          .getSector(sectorSlug)
          .pipe(
            catchError((e) => {
              if (e.status === 404) {
                this.router.navigate(['/not-found']);
                return EMPTY;
              }
              return throwError(() => e);
            }),
          )
          .subscribe((sector) => {
            this.sector = sector;
            this.setFormValue();
            this.loadingState = LoadingState.DEFAULT;
          });
      } else {
        this.setPageTitle();
        this.store.select(selectInstanceName).subscribe((instanceName) => {
          this.title.setTitle(
            `${this.translocoService.translate(marker('sectorFormBrowserTitle'))} - ${instanceName}`,
          );
        });
        this.sectorForm.get('secret').setValue(this.parentCrag.secret);
        this.loadingState = LoadingState.DEFAULT;
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
      rulesTitle: [null, [Validators.maxLength(255)]],
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
    this.sectorForm.enable();
    this.sectorForm.patchValue({
      name: this.sector.name,
      description: this.sector.description,
      shortDescription: this.sector.shortDescription,
      portraitImage: this.sector.portraitImage,
      rules: this.sector.rules,
      rulesTitle: this.sector.rulesTitle,
      secret: this.sector.secret,
      mapMarkers: this.sector.mapMarkers,
      condicasterCragId: this.sector.condicasterCragId,
      condicasterCragName: this.sector.condicasterCragName,
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
      sector.rulesTitle = this.sectorForm.get('rulesTitle').value || null;
      sector.portraitImage = this.sectorForm.get('portraitImage').value;
      sector.secret = this.sectorForm.get('secret').value;
      sector.mapMarkers = this.sectorForm.get('mapMarkers').value;
      sector.closureSchedules =
        this.sectorForm.get('closureSchedules').value ?? [];
      const condicasterCragId = this.sectorForm.get('condicasterCragId').value;
      sector.condicasterCragId =
        condicasterCragId === null || condicasterCragId === ''
          ? null
          : Number(condicasterCragId);
      sector.condicasterCragName = sector.condicasterCragId
        ? this.sectorForm.get('condicasterCragName').value || null
        : null;
      if (this.sector) {
        sector.slug = this.sector.slug;
        this.uploadService
          .saveFileFocusIfChanged(sector.portraitImage)
          .pipe(switchMap(() => this.sectorsService.updateSector(sector)))
          .subscribe((sector) => {
            this.store.dispatch(toastNotification('SECTOR_UPDATED'));
            this.router.navigate(['/topo', this.cragSlug, sector.slug]);
            this.loadingState = LoadingState.DEFAULT;
          });
      } else {
        this.uploadService
          .saveFileFocusIfChanged(sector.portraitImage)
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
  confirmDeleteSector(_event: Event) {
    this.confirmDialog.open({
      message: this.translocoService.translate(
        marker('sector.askReallyWantToDeleteSector'),
      ),
      acceptLabel: this.translocoService.translate(marker('sector.yesDelete')),
      rejectLabel: this.translocoService.translate(
        marker('sector.noDontDelete'),
      ),
      accept: () => {
        this.deleteSector();
      },
      destructive: true,
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

  protected markerCoordinates(): Coordinates | null {
    const markers = this.sectorForm?.get('mapMarkers')?.value as
      { coordinates?: Coordinates }[] | null;
    return markers?.find((marker) => marker?.coordinates)?.coordinates ?? null;
  }

  protected setCondicasterCrag(link: CondicasterCragLink | null): void {
    this.sectorForm.patchValue({
      condicasterCragId: link?.cragId ?? null,
      condicasterCragName: link?.name ?? null,
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
