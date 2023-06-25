import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {CragsService} from '../../../services/crud/crags.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Crag} from '../../../models/crag';
import {MenuItem} from 'primeng/api';
import {TranslocoService} from '@ngneat/transloco';
import {environment} from '../../../../environments/environment';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {forkJoin, of} from 'rxjs';
import {catchError, take} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {selectIsMobile} from '../../../ngrx/selectors/device.selectors';
import {selectIsLoggedIn} from '../../../ngrx/selectors/auth.selectors';

@Component({
  selector: 'lc-crag',
  templateUrl: './crag.component.html',
  styleUrls: ['./crag.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CragComponent implements OnInit {

  public crag: Crag;
  public items: MenuItem[];
  public activeItem: MenuItem;

  constructor(private cragsService: CragsService,
              private translocoService: TranslocoService,
              private router: Router,
              private store: Store,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    const cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    forkJoin([
      this.cragsService.getCrag(cragSlug).pipe(catchError(e => {
        if (e.status === 404) {
          this.router.navigate(['/not-found']);
        }
        return of(e);
      })),
      this.store.pipe(select(selectIsLoggedIn), take(1)),
      this.translocoService.load(`${environment.language}`)
    ]).subscribe(([crag, isLoggedIn]) => {
      this.crag = crag;
      this.items = [
        {id: 'infos', label: this.translocoService.translate(marker('crag.infos')), icon: 'pi pi-fw pi-info-circle'}, // todo add router links and add them to api
        {id: 'sectors', label: this.translocoService.translate(marker('crag.sectors')), icon: 'pi pi-fw pi-sitemap'},
        {id: 'gallery', label: this.translocoService.translate(marker('crag.gallery')), icon: 'pi pi-fw pi-images'},
        {id: 'ascents', label: this.translocoService.translate(marker('crag.ascents')), icon: 'pi pi-fw pi-users'},
        {
          label: this.translocoService.translate(marker('crag.edit')),
          icon: 'pi pi-fw pi-file-edit',
          routerLink: `/crags/${this.crag.slug}/edit`,
          visible: isLoggedIn,
          id: 'edit'
        },
      ];
      this.activeItem = this.items[0];
    })
  }


}
