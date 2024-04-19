import {Component, OnInit} from '@angular/core';
import {AscentListComponent} from '../../ascent/ascent-list/ascent-list.component';
import {NgForOf, NgIf} from '@angular/common';
import {SkeletonModule} from 'primeng/skeleton';
import {Crag} from '../../../models/crag';
import {CragsService} from '../../../services/crud/crags.service';
import {TranslocoService} from '@ngneat/transloco';
import {ActivatedRoute, Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {Title} from '@angular/platform-browser';
import {catchError} from 'rxjs/operators';
import {of} from 'rxjs';
import {selectInstanceName} from '../../../ngrx/selectors/instance-settings.selectors';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {Sector} from '../../../models/sector';
import {SectorsService} from '../../../services/crud/sectors.service';

@Component({
  selector: 'lc-sector-ascents',
  standalone: true,
  imports: [
    AscentListComponent,
    NgIf,
    SkeletonModule,
    NgForOf
  ],
  templateUrl: './sector-ascents.component.html',
  styleUrl: './sector-ascents.component.scss'
})
export class SectorAscentsComponent implements OnInit{

  public sector: Sector;

  constructor(private sectorsService: SectorsService,
              private translocoService: TranslocoService,
              private router: Router,
              private store: Store,
              private title: Title,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    const sectorSlug = this.route.snapshot.parent.parent.paramMap.get('sector-slug');
    this.sectorsService.getSector(sectorSlug).pipe(catchError(e => {
      if (e.status === 404) {
        this.router.navigate(['/not-found']);
      }
      return of(e);
    })).subscribe((sector) => {
      this.sector = sector;
      this.store.select(selectInstanceName).subscribe(instanceName => {
        this.title.setTitle(`${sector.name} / ${this.translocoService.translate(marker('ascents'))} - ${instanceName}`);
      });
    })
  }

}
