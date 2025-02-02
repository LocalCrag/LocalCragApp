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
import { SectorsService } from '../../../services/crud/sectors.service';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { catchError, map } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { NotificationIdentifier } from '../../../utility/notifications/notification-identifier.enum';
import { environment } from '../../../../environments/environment';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Area } from '../../../models/area';
import { AreasService } from '../../../services/crud/areas.service';
import { Title } from '@angular/platform-browser';
import { Editor } from 'primeng/editor';
import { UploadService } from '../../../services/crud/upload.service';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import {
  disabledMarkerTypesArea,
  MapMarkerType,
} from '../../../enums/map-marker-type';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ScalesService } from '../../../services/crud/scales.service';
import { LineType } from '../../../enums/line-type';

/**
 * Form component for creating and editing areas.
 */
@Component({
  selector: 'lc-area-form',
  templateUrl: './area-form.component.html',
  styleUrls: ['./area-form.component.scss'],
  providers: [ConfirmationService],
})
@UntilDestroy()
export class AreaFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChildren(Editor) editors: QueryList<Editor>;

  public areaForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public area: Area;
  public editMode = false;
  public boulderScales: SelectItem<string | null>[] = [];
  public sportScales: SelectItem<string | null>[] = [];
  public tradScales: SelectItem<string | null>[] = [];
  public quillModules: any;
  public parentSecret = false;
  public parentClosed = false;

  private cragSlug: string;
  private sectorSlug: string;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private route: ActivatedRoute,
    private router: Router,
    private areasService: AreasService,
    private sectorsService: SectorsService,
    private uploadService: UploadService,
    private title: Title,
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
    const scalesPopulated = this.scalesService.getFormScaleSelectors(
      [{label: this.translocoService.translate(marker("defaultScalesLabel")), value: null}]
    ).pipe(map(groupedScales => {
      this.boulderScales = groupedScales[LineType.BOULDER];
      this.sportScales = groupedScales[LineType.SPORT];
      this.tradScales = groupedScales[LineType.TRAD];
      return true;
    }));

    this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    this.sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
    const areaSlug = this.route.snapshot.paramMap.get('area-slug');

    this.sectorsService.getSector(this.sectorSlug).subscribe((sector) => {
      this.parentSecret = sector.secret;
      this.parentClosed = sector.closed;
      this.buildForm();
      if (areaSlug) {
        this.editMode = true;
        this.areaForm.disable();
        forkJoin([
          this.areasService
            .getArea(areaSlug)
            .pipe(
              catchError((e) => {
                if (e.status === 404) {
                  this.router.navigate(['/not-found']);
                }
                return of(e);
              }),
            ),
            scalesPopulated
          ]).subscribe(([area, _]) => {
            this.area = area;
            this.setFormValue();
            this.loadingState = LoadingState.DEFAULT;
            this.editors?.map((editor) => {
              editor.getQuill().enable();
            });
          });
      } else {
        this.store.select(selectInstanceName).subscribe((instanceName) => {
          this.title.setTitle(
            `${this.translocoService.translate(marker('areaFormBrowserTitle'))} - ${instanceName}`,
          );
        });
        this.areaForm.disable();
        scalesPopulated.subscribe(() => {
          this.areaForm.enable();
          this.areaForm.get('secret').setValue(this.parentSecret);
          this.loadingState = LoadingState.DEFAULT;
        });
      }
    });
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
      closed: [false],
      closedReason: [null],
      defaultBoulderScale: [null],
      defaultSportScale: [null],
      defaultTradScale: [null],
    });
    this.areaForm
      .get('closed')
      .valueChanges.pipe(untilDestroyed(this))
      .subscribe((closed) => {
        if (!closed) {
          this.areaForm.get('closedReason').setValue(null);
        }
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
      closed: this.area.closed,
      closedReason: this.area.closedReason,
      defaultBoulderScale: this.area.defaultBoulderScale,
      defaultSportScale: this.area.defaultSportScale,
      defaultTradScale: this.area.defaultTradScale,
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
      area.closed = this.areaForm.get('closed').value;
      area.closedReason = this.areaForm.get('closedReason').value;
      area.defaultBoulderScale = this.areaForm.get('defaultBoulderScale').value;
      area.defaultSportScale = this.areaForm.get('defaultSportScale').value;
      area.defaultTradScale = this.areaForm.get('defaultTradScale').value;
      if (this.area) {
        area.slug = this.area.slug;
        this.areasService.updateArea(area).subscribe((area) => {
          this.store.dispatch(
            toastNotification(NotificationIdentifier.AREA_UPDATED),
          );
          this.router.navigate([
            '/topo',
            this.cragSlug,
            this.sectorSlug,
            area.slug,
          ]);
          this.loadingState = LoadingState.DEFAULT;
        });
      } else {
        this.areasService.createArea(area, this.sectorSlug).subscribe(() => {
          this.store.dispatch(
            toastNotification(NotificationIdentifier.AREA_CREATED),
          );
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
  confirmDeleteArea(event: Event) {
    this.translocoService.load(`${environment.language}`).subscribe(() => {
      this.confirmationService.confirm({
        target: event.target,
        message: this.translocoService.translate(
          marker('area.askReallyWantToDeleteArea'),
        ),
        acceptLabel: this.translocoService.translate(marker('area.yesDelete')),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(
          marker('area.noDontDelete'),
        ),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.deleteArea();
        },
      });
    });
  }

  /**
   * Deletes the area and navigates to the area list.
   */
  public deleteArea() {
    this.areasService.deleteArea(this.area).subscribe(() => {
      this.store.dispatch(
        toastNotification(NotificationIdentifier.AREA_DELETED),
      );
      this.router.navigate(['/topo', this.cragSlug, this.sectorSlug, 'areas']);
      this.loadingState = LoadingState.DEFAULT;
    });
  }

  protected readonly disabledMarkerTypesArea = disabledMarkerTypesArea;
  protected readonly MapMarkerType = MapMarkerType;
}
