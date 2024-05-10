import {Component, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {FormDirective} from '../../shared/forms/form.directive';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {LoadingState} from '../../../enums/loading-state';
import {Sector} from '../../../models/sector';
import {Store} from '@ngrx/store';
import {ActivatedRoute, Router} from '@angular/router';
import {SectorsService} from '../../../services/crud/sectors.service';
import {TranslocoService} from '@ngneat/transloco';
import {ConfirmationService} from 'primeng/api';
import {catchError} from 'rxjs/operators';
import {of} from 'rxjs';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';
import {environment} from '../../../../environments/environment';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {Area} from '../../../models/area';
import {AreasService} from '../../../services/crud/areas.service';
import {latValidator} from '../../../utility/validators/lat.validator';
import {lngValidator} from '../../../utility/validators/lng.validator';
import {Title} from '@angular/platform-browser';
import {Editor} from 'primeng/editor';
import {UploadService} from '../../../services/crud/upload.service';
import {clearGradeCache} from '../../../ngrx/actions/cache.actions';
import {selectInstanceName} from '../../../ngrx/selectors/instance-settings.selectors';

/**
 * Form component for creating and editing areas.
 */
@Component({
  selector: 'lc-area-form',
  templateUrl: './area-form.component.html',
  styleUrls: ['./area-form.component.scss'],
  providers: [ConfirmationService]
})
export class AreaFormComponent implements OnInit {

  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChildren(Editor) editors: QueryList<Editor>;

  public areaForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public area: Area;
  public editMode = false;
  public quillModules: any;
  public parentSecret = false;

  private cragSlug: string;
  private sectorSlug: string;

  constructor(private fb: FormBuilder,
              private store: Store,
              private route: ActivatedRoute,
              private router: Router,
              private areasService: AreasService,
              private sectorsService: SectorsService,
              private uploadService: UploadService,
              private title: Title,
              private translocoService: TranslocoService,
              private confirmationService: ConfirmationService) {
    this.quillModules = this.uploadService.getQuillFileUploadModules();
  }

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    this.sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
    const areaSlug = this.route.snapshot.paramMap.get('area-slug');
    this.sectorsService.getSector(this.sectorSlug).subscribe(sector => {
      this.parentSecret = sector.secret;
      this.buildForm();
      if (areaSlug) {
        this.editMode = true;
        this.areaForm.disable();
        this.areasService.getArea(areaSlug).pipe(catchError(e => {
          if (e.status === 404) {
            this.router.navigate(['/not-found']);
          }
          return of(e);
        })).subscribe(area => {
          this.area = area;
          this.setFormValue();
          this.loadingState = LoadingState.DEFAULT;
          this.editors?.map(editor => {
            editor.getQuill().enable();
          });
        });
      } else {
        this.store.select(selectInstanceName).subscribe(instanceName => {
          this.title.setTitle(`${this.translocoService.translate(marker('areaFormBrowserTitle'))} - ${instanceName}`);
        });
        this.areaForm.get('secret').setValue(this.parentSecret);
        this.loadingState = LoadingState.DEFAULT;
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
      gps: [null],
      portraitImage: [null],
      secret: [null],
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
      gps: this.area.gps,
      portraitImage: this.area.portraitImage,
      secret: this.area.secret,
    });
  }

  /**
   * Cancels the form.
   */
  cancel() {
    if (this.area) {
      this.router.navigate(['/topo', this.cragSlug, this.sectorSlug, this.area.slug]);
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
      const area = new Area;
      area.name = this.areaForm.get('name').value;
      area.description = this.areaForm.get('description').value;
      area.shortDescription = this.areaForm.get('shortDescription').value;
      area.gps = this.areaForm.get('gps').value;
      area.portraitImage = this.areaForm.get('portraitImage').value;
      area.secret = this.areaForm.get('secret').value;
      if (this.area) {
        area.slug = this.area.slug;
        this.areasService.updateArea(this.sectorSlug, area).subscribe(area => {
          this.store.dispatch(toastNotification(NotificationIdentifier.AREA_UPDATED));
          this.router.navigate(['/topo', this.cragSlug, this.sectorSlug, area.slug]);
          this.loadingState = LoadingState.DEFAULT;
        });
      } else {
        this.areasService.createArea(area, this.sectorSlug).subscribe(area => {
          this.store.dispatch(toastNotification(NotificationIdentifier.AREA_CREATED));
          this.router.navigate(['/topo', this.cragSlug, this.sectorSlug, 'areas']);
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
        message: this.translocoService.translate(marker('area.askReallyWantToDeleteArea')),
        acceptLabel: this.translocoService.translate(marker('area.yesDelete')),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(marker('area.noDontDelete')),
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
    this.areasService.deleteArea(this.sectorSlug, this.area).subscribe(() => {
      this.store.dispatch(toastNotification(NotificationIdentifier.AREA_DELETED));
      this.router.navigate(['/topo', this.cragSlug, this.sectorSlug, 'areas']);
      this.loadingState = LoadingState.DEFAULT;
      this.store.dispatch(clearGradeCache({area: null, crag: this.cragSlug, sector: this.sectorSlug}))
    });
  }

}
