import {Component, ViewChild} from '@angular/core';
import {FormDirective} from '../../shared/forms/form.directive';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {LoadingState} from '../../../enums/loading-state';
import {Area} from '../../../models/area';
import {Store} from '@ngrx/store';
import {ActivatedRoute, Router} from '@angular/router';
import {AreasService} from '../../../services/crud/areas.service';
import {TranslocoService} from '@ngneat/transloco';
import {ConfirmationService} from 'primeng/api';
import {catchError} from 'rxjs/operators';
import {of} from 'rxjs';
import {latValidator} from '../../../utility/validators/lat.validator';
import {lngValidator} from '../../../utility/validators/lng.validator';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';
import {environment} from '../../../../environments/environment';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {TopoImage} from '../../../models/topo-image';
import {TopoImagesService} from '../../../services/crud/topo-images.service';

/**
 * Component for uploading topo images.
 */
@Component({
    selector: 'lc-topo-image-form',
    templateUrl: './topo-image-form.component.html',
    styleUrls: ['./topo-image-form.component.scss']
})
export class TopoImageFormComponent {

    @ViewChild(FormDirective) formDirective: FormDirective;

    public topoImageForm: FormGroup;
    public loadingState = LoadingState.DEFAULT;
    public loadingStates = LoadingState;
    public topoImage: TopoImage;

    private cragSlug: string;
    private sectorSlug: string;
    private areaSlug: string;

    constructor(private fb: FormBuilder,
                private store: Store,
                private route: ActivatedRoute,
                private router: Router,
                private topoImagesService: TopoImagesService) {
    }

    /**
     * Builds the form on component initialization.
     */
    ngOnInit() {
        this.buildForm();
        this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
        this.sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
        this.areaSlug = this.route.snapshot.paramMap.get('area-slug');
    }

    /**
     * Builds the area form.
     */
    private buildForm() {
        this.topoImageForm = this.fb.group({
            image: [null, [Validators.required]]
        });
    }


    /**
     * Cancels the form.
     */
    cancel() {
        this.router.navigate(['/topo', this.cragSlug, this.sectorSlug, this.areaSlug, 'topo-images']);
    }

    /**
     * Saves the topo image and navigates to the topo image list.
     */
    public saveTopoImage() {
        if (this.topoImageForm.valid) {
            this.loadingState = LoadingState.LOADING;
            const topoImage = new TopoImage();
            topoImage.image = this.topoImageForm.get('image').value;
            this.topoImagesService.addTopoImage(topoImage, this.areaSlug).subscribe(area => {
                this.store.dispatch(toastNotification(NotificationIdentifier.TOPO_IMAGE_ADDED));
                this.router.navigate(['/topo', this.cragSlug, this.sectorSlug, this.areaSlug, 'topo-images']);
                this.loadingState = LoadingState.DEFAULT;
            });
        } else {
            this.formDirective.markAsTouched();
        }
    }

}
