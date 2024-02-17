import {Component, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {FormDirective} from '../../shared/forms/form.directive';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
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
import {Sector} from '../../../models/sector';
import {SectorsService} from '../../../services/crud/sectors.service';
import {Title} from '@angular/platform-browser';
import {latValidator} from '../../../utility/validators/lat.validator';
import {lngValidator} from '../../../utility/validators/lng.validator';
import {Editor} from 'primeng/editor';
import {UploadService} from '../../../services/crud/upload.service';
import {clearGradeCache} from '../../../ngrx/actions/cache.actions';

/**
 * Form component for creating and editing sectors.
 */
@Component({
  selector: 'lc-sector-form',
  templateUrl: './sector-form.component.html',
  styleUrls: ['./sector-form.component.scss'],
  providers: [ConfirmationService]
})
export class SectorFormComponent implements OnInit {

  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChildren(Editor) editors: QueryList<Editor>;

  public sectorForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public sector: Sector;
  public editMode = false;
  public quillModules: any;

  private cragSlug: string;

  constructor(private fb: FormBuilder,
              private store: Store,
              private title: Title,
              private route: ActivatedRoute,
              private router: Router,
              private sectorsService: SectorsService,
              private uploadService: UploadService,
              private translocoService: TranslocoService,
              private confirmationService: ConfirmationService) {
    this.quillModules = this.uploadService.getQuillFileUploadModules();
  }

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.buildForm();
    this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    const sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
    if (sectorSlug) {
      this.editMode = true;
      this.sectorForm.disable();
      this.sectorsService.getSector(sectorSlug).pipe(catchError(e => {
        if (e.status === 404) {
          this.router.navigate(['/not-found']);
        }
        return of(e);
      })).subscribe(sector => {
        this.sector = sector;
        this.setFormValue();
        this.loadingState = LoadingState.DEFAULT;
        this.editors?.map(editor => {
          editor.getQuill().enable();
        });
      });
    } else {
      this.title.setTitle(`${this.translocoService.translate(marker('sectorFormBrowserTitle'))} - ${environment.instanceName}`)
      this.loadingState = LoadingState.DEFAULT;
    }
  }

  /**
   * Builds the crag form.
   */
  private buildForm() {
    this.sectorForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [null],
      shortDescription: [null],
      portraitImage: [null],
      lat: ['', [latValidator()]],
      lng: ['', [lngValidator()]],
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
      lat: this.sector.lat,
      lng: this.sector.lng,
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
      const sector = new Sector;
      sector.name = this.sectorForm.get('name').value
      sector.description = this.sectorForm.get('description').value
      sector.shortDescription = this.sectorForm.get('shortDescription').value
      sector.portraitImage = this.sectorForm.get('portraitImage').value
      sector.lat = this.sectorForm.get('lat').value ? Number(this.sectorForm.get('lat').value) : null;
      sector.lng = this.sectorForm.get('lng').value ? Number(this.sectorForm.get('lng').value) : null;
      if (this.sector) {
        sector.slug = this.sector.slug;
        this.sectorsService.updateSector(this.cragSlug, sector).subscribe(sector => {
          this.store.dispatch(toastNotification(NotificationIdentifier.SECTOR_UPDATED));
          this.router.navigate(['/topo', this.cragSlug, sector.slug]);
          this.loadingState = LoadingState.DEFAULT;
        });
      } else {
        this.sectorsService.createSector(sector, this.cragSlug).subscribe(sector => {
          this.store.dispatch(toastNotification(NotificationIdentifier.SECTOR_CREATED));
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
        message: this.translocoService.translate(marker('sector.askReallyWantToDeleteSector')),
        acceptLabel: this.translocoService.translate(marker('sector.yesDelete')),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(marker('sector.noDontDelete')),
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
    this.sectorsService.deleteSector(this.cragSlug, this.sector).subscribe(() => {
      this.store.dispatch(toastNotification(NotificationIdentifier.SECTOR_DELETED));
      this.router.navigate(['/topo', this.cragSlug, 'sectors']);
      this.loadingState = LoadingState.DEFAULT;
      this.store.dispatch(clearGradeCache({area: null, crag: this.cragSlug, sector: null}))
    });
  }

}
