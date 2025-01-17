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
import { ConfirmationService } from 'primeng/api';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
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
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';

/**
 * Form component for creating and editing sectors.
 */
@Component({
  selector: 'lc-sector-form',
  templateUrl: './sector-form.component.html',
  styleUrls: ['./sector-form.component.scss'],
  providers: [ConfirmationService],
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
  ) {
    this.quillModules = this.uploadService.getQuillFileUploadModules();
  }

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    const sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
    this.cragsService.getCrag(this.cragSlug).subscribe((crag) => {
      this.parentSecret = crag.secret;
      this.parentClosed = crag.closed;
      this.buildForm();
      if (sectorSlug) {
        this.editMode = true;
        this.sectorForm.disable();
        this.sectorsService
          .getSector(sectorSlug)
          .pipe(
            catchError((e) => {
              if (e.status === 404) {
                this.router.navigate(['/not-found']);
              }
              return of(e);
            }),
          )
          .subscribe((sector) => {
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
        this.sectorForm.get('secret').setValue(this.parentSecret);
        this.loadingState = LoadingState.DEFAULT;
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
}
