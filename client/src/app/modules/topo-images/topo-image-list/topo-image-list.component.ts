import {Component} from '@angular/core';
import {Line} from '../../../models/line';
import {LoadingState} from '../../../enums/loading-state';
import {ConfirmationService, SelectItem} from 'primeng/api';
import {forkJoin, Observable} from 'rxjs';
import {LinesService} from '../../../services/crud/lines.service';
import {select, Store} from '@ngrx/store';
import {ActivatedRoute} from '@angular/router';
import {TranslocoService} from '@ngneat/transloco';
import {environment} from '../../../../environments/environment';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {selectIsLoggedIn} from '../../../ngrx/selectors/auth.selectors';
import {selectIsMobile} from '../../../ngrx/selectors/device.selectors';
import {TopoImage} from '../../../models/topo-image';
import {TopoImagesService} from '../../../services/crud/topo-images.service';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';

/**
 * Component that lists all topo images in an area.
 */
@Component({
    selector: 'lc-topo-image-list',
    templateUrl: './topo-image-list.component.html',
    styleUrls: ['./topo-image-list.component.scss'],
    providers: [ConfirmationService]
})
export class TopoImageListComponent {

    public topoImages: TopoImage[];
    public loading = LoadingState.LOADING;
    public loadingStates = LoadingState;
    public loadingState = LoadingState.INITIAL_LOADING;
    public sortOptions: SelectItem[];
    public sortKey: SelectItem;
    public sortOrder: number;
    public sortField: string;
    public isLoggedIn$: Observable<boolean>;
    public isMobile$: Observable<boolean>;
    public cragSlug: string;
    public sectorSlug: string;
    public areaSlug: string;

    constructor(private topoImagesService: TopoImagesService,
                private store: Store,
                private confirmationService: ConfirmationService,
                private route: ActivatedRoute,
                private translocoService: TranslocoService) {
    }

    /**
     * Loads the lines on initialization.
     */
    ngOnInit() {
        this.cragSlug = this.route.parent.parent.snapshot.paramMap.get('crag-slug');
        this.sectorSlug = this.route.parent.parent.snapshot.paramMap.get('sector-slug');
        this.areaSlug = this.route.parent.parent.snapshot.paramMap.get('area-slug');
        forkJoin([
            this.topoImagesService.getTopoImages(this.areaSlug),
            this.translocoService.load(`${environment.language}`)
        ]).subscribe(([topoImages, e]) => {
            this.topoImages = topoImages;
            this.loading = LoadingState.DEFAULT;
            this.sortOptions = [
                {label: this.translocoService.translate(marker('sortAZ')), value: '!name'}, // TODO
                {label: this.translocoService.translate(marker('sortZA')), value: 'name'} // TODO
            ];
            this.sortKey = this.sortOptions[0];
        });
        this.isLoggedIn$ = this.store.pipe(select(selectIsLoggedIn));
        this.isMobile$ = this.store.pipe(select(selectIsMobile));
    }

    /**
     * Sets the sort field and order.
     * @param event Sort change event.
     */
    onSortChange(event: any) {
        let value = event.value.value;
        if (value.indexOf('!') === 0) {
            this.sortOrder = 1;
            this.sortField = value.substring(1, value.length);
        } else {
            this.sortOrder = -1;
            this.sortField = value;
        }
    }

    /**
     * Asks if the line should really get deleted.
     * @param event Click event.
     * @param topoImage Topo image to delete.
     */
    confirmDeleteTopoImage(event: Event, topoImage: TopoImage) {
        this.translocoService.load(`${environment.language}`).subscribe(() => {
            this.confirmationService.confirm({
                target: event.target,
                message: this.translocoService.translate(marker('topoImage.askReallyWantToDeleteTopoImage')),
                acceptLabel: this.translocoService.translate(marker('topoImage.yesDelete')),
                acceptButtonStyleClass: 'p-button-danger',
                rejectLabel: this.translocoService.translate(marker('topoImage.noDontDelete')),
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.deleteTopoImage(topoImage);
                },
            });
        });
    }

    /**
     * Deletes the line and navigates to the line list.
     */
    public deleteTopoImage(topoImage: TopoImage) {
        this.topoImagesService.deleteTopoImage(this.areaSlug, topoImage).subscribe(() => {
            this.store.dispatch(toastNotification(NotificationIdentifier.TOPO_IMAGE_DELETED));
            this.topoImages.splice(this.topoImages.indexOf(topoImage), 1)
            this.topoImages = [...this.topoImages];
            this.loadingState = LoadingState.DEFAULT;
        });
    }

}
