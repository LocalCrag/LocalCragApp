import {Component, OnInit} from '@angular/core';
import {AscentListComponent} from '../../ascent/ascent-list/ascent-list.component';
import {NgForOf, NgIf} from '@angular/common';
import {SkeletonModule} from 'primeng/skeleton';
import {Sector} from '../../../models/sector';
import {SectorsService} from '../../../services/crud/sectors.service';
import {TranslocoService} from '@ngneat/transloco';
import {ActivatedRoute, Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {Title} from '@angular/platform-browser';
import {catchError} from 'rxjs/operators';
import {of} from 'rxjs';
import {selectInstanceName} from '../../../ngrx/selectors/instance-settings.selectors';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {AreasService} from '../../../services/crud/areas.service';
import {Area} from '../../../models/area';

@Component({
  selector: 'lc-area-ascents',
  standalone: true,
    imports: [
        AscentListComponent,
        NgForOf,
        NgIf,
        SkeletonModule
    ],
  templateUrl: './area-ascents.component.html',
  styleUrl: './area-ascents.component.scss'
})
export class AreaAscentsComponent implements OnInit{

  public area: Area;

  constructor(private areasService: AreasService,
              private translocoService: TranslocoService,
              private router: Router,
              private store: Store,
              private title: Title,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    const areaSlug = this.route.snapshot.parent.parent.paramMap.get('area-slug');
    this.areasService.getArea(areaSlug).pipe(catchError(e => {
      if (e.status === 404) {
        this.router.navigate(['/not-found']);
      }
      return of(e);
    })).subscribe((area) => {
      this.area = area;
      this.store.select(selectInstanceName).subscribe(instanceName => {
        this.title.setTitle(`${area.name} / ${this.translocoService.translate(marker('ascents'))} - ${instanceName}`);
      });
    })
  }

}
