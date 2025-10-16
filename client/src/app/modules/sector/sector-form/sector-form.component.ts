import {
  Component,
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
import { catchError, map } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { environment } from '../../../../environments/environment';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Sector } from '../../../models/sector';
import { SectorsService } from '../../../services/crud/sectors.service';
import { Title } from '@angular/platform-browser';
import { Editor } from 'primeng/editor';
import { UploadService } from '../../../services/crud/upload.service';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { CragsService } from '../../../services/crud/crags.service';
import {
  disabledMarkerTypesCrag,
  disabledMarkerTypesSector,
  MapMarkerType,
} from '../../../enums/map-marker-type';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ScalesService } from '../../../services/crud/scales.service';
import { LineType } from '../../../enums/line-type';
import { Card } from 'primeng/card';
import { NgIf } from '@angular/common';
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
    Card,
    NgIf,
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
  ],
})
@UntilDestroy()
export class SectorFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChildren(Editor) editors: QueryList<Editor>;

  public sectorForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public sector: Sector;
  public editMode = false;
  public boulderScales: SelectItem<string | null>[] = [];
  public sportScales: SelectItem<string | null>[] = [];
  public tradScales: SelectItem<string | null>[] = [];
  public quillModules: any;
  public parentSecret = false;
  public parentClosed = false;

  private cragSlug: string;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private title: Title,
    private route: ActivatedRoute,
    private router: Router,
    private sectorsService: SectorsService,
    private cragsService: CragsService,
    private uploadService: UploadService,
    private translocoService: TranslocoService,
    private confirmationService: ConfirmationService,
    private scalesService: ScalesService,
  ) {
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

    this.cragsService.getCrag(this.cragSlug).subscribe((crag) => {
      this.parentSecret = crag.secret;
      this.parentClosed = crag.closed;
      this.buildForm();
      if (sectorSlug) {
        this.editMode = true;
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
        this.store.select(selectInstanceName).subscribe((instanceName) => {
          this.title.setTitle(
            `${this.translocoService.translate(marker('sectorFormBrowserTitle'))} - ${instanceName}`,
          );
        });
        this.sectorForm.disable();
        scalesPopulated.subscribe(() => {
          this.sectorForm.get('secret').setValue(this.parentSecret);
          this.sectorForm.enable();
          this.loadingState = LoadingState.DEFAULT;
        });
      }
    });
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
      closed: [false],
      closedReason: [null],
      defaultBoulderScale: [null],
      defaultSportScale: [null],
      defaultTradScale: [null],
    });
    this.sectorForm
      .get('closed')
      .valueChanges.pipe(untilDestroyed(this))
      .subscribe((closed) => {
        if (!closed) {
          this.sectorForm.get('closedReason').setValue(null);
        }
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
      closed: this.sector.closed,
      closedReason: this.sector.closedReason,
      defaultBoulderScale: this.sector.defaultBoulderScale,
      defaultSportScale: this.sector.defaultSportScale,
      defaultTradScale: this.sector.defaultTradScale,
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
      sector.closed = this.sectorForm.get('closed').value;
      sector.closedReason = this.sectorForm.get('closedReason').value;
      sector.defaultBoulderScale = this.sectorForm.get(
        'defaultBoulderScale',
      ).value;
      sector.defaultSportScale = this.sectorForm.get('defaultSportScale').value;
      sector.defaultTradScale = this.sectorForm.get('defaultTradScale').value;
      if (this.sector) {
        sector.slug = this.sector.slug;
        this.sectorsService.updateSector(sector).subscribe((sector) => {
          this.store.dispatch(toastNotification('SECTOR_UPDATED'));
          this.router.navigate(['/topo', this.cragSlug, sector.slug]);
          this.loadingState = LoadingState.DEFAULT;
        });
      } else {
        this.sectorsService
          .createSector(sector, this.cragSlug)
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
    this.translocoService.load(`${environment.language}`).subscribe(() => {
      this.confirmationService.confirm({
        target: event.target,
        message: this.translocoService.translate(
          marker('sector.askReallyWantToDeleteSector'),
        ),
        acceptLabel: this.translocoService.translate(
          marker('sector.yesDelete'),
        ),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(
          marker('sector.noDontDelete'),
        ),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.deleteSector();
        },
      });
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

  protected readonly disabledMarkerTypesCrag = disabledMarkerTypesCrag;
  protected readonly disabledMarkerTypesSector = disabledMarkerTypesSector;
  protected readonly MapMarkerType = MapMarkerType;
  protected readonly environment = environment;
}
