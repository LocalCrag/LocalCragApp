import {
  Component,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingState } from '../../../enums/loading-state';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { catchError, map } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { NotificationIdentifier } from '../../../utility/notifications/notification-identifier.enum';
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
import { ScalesService } from '../../../services/crud/scales.service';
import { LineType } from '../../../enums/line-type';

/**
 * Form component for creating and editing sectors.
 */
@Component({
  selector: 'lc-sector-form',
  templateUrl: './sector-form.component.html',
  styleUrls: ['./sector-form.component.scss'],
  providers: [ConfirmationService],
})
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
    const scalesPopulated = this.scalesService.getScales().pipe(map(scales => {
      const boulderScales = [{label: "inherit", value: null}];
      const sportScales = [{label: "inherit", value: null}];
      const tradScales = [{label: "inherit", value: null}];

      scales.forEach(scale => {
        switch (scale.lineType) {
          case LineType.BOULDER:
            boulderScales.push({label: scale.name, value: scale.name});
            break;
          case LineType.SPORT:
            sportScales.push({label: scale.name, value: scale.name});
            break;
          case LineType.TRAD:
            tradScales.push({label: scale.name, value: scale.name});
        }
      });

      this.boulderScales = boulderScales;
      this.sportScales = sportScales;
      this.tradScales = tradScales;

      return true;
    }));

    this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    const sectorSlug = this.route.snapshot.paramMap.get('sector-slug');

    this.cragsService.getCrag(this.cragSlug).subscribe((crag) => {
      this.parentSecret = crag.secret;
      this.buildForm();
      if (sectorSlug) {
        this.editMode = true;
        this.sectorForm.disable();
        forkJoin([
          this.sectorsService
            .getSector(sectorSlug)
            .pipe(
              catchError((e) => {
                if (e.status === 404) {
                  this.router.navigate(['/not-found']);
                }
                return of(e);
              }),
            ),
          scalesPopulated
        ]).subscribe(([sector, _]) => {
          this.sector = sector;
          this.setFormValue();
          this.loadingState = LoadingState.DEFAULT;
          this.editors?.map((editor) => {
            editor.getQuill().enable();
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
      defaultBoulderScale: [null],
      defaultSportScale: [null],
      defaultTradScale: [null],
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
      sector.defaultBoulderScale = this.sectorForm.get('defaultBoulderScale').value;
      sector.defaultSportScale = this.sectorForm.get('defaultSportScale').value;
      sector.defaultTradScale = this.sectorForm.get('defaultTradScale').value;
      if (this.sector) {
        sector.slug = this.sector.slug;
        this.sectorsService.updateSector(sector).subscribe((sector) => {
          this.store.dispatch(
            toastNotification(NotificationIdentifier.SECTOR_UPDATED),
          );
          this.router.navigate(['/topo', this.cragSlug, sector.slug]);
          this.loadingState = LoadingState.DEFAULT;
        });
      } else {
        this.sectorsService
          .createSector(sector, this.cragSlug)
          .subscribe(() => {
            this.store.dispatch(
              toastNotification(NotificationIdentifier.SECTOR_CREATED),
            );
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
      this.store.dispatch(
        toastNotification(NotificationIdentifier.SECTOR_DELETED),
      );
      this.router.navigate(['/topo', this.cragSlug, 'sectors']);
      this.loadingState = LoadingState.DEFAULT;
    });
  }

  protected readonly disabledMarkerTypesCrag = disabledMarkerTypesCrag;
  protected readonly disabledMarkerTypesSector = disabledMarkerTypesSector;
  protected readonly MapMarkerType = MapMarkerType;
  protected readonly environment = environment;
}
