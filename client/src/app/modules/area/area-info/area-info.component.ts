import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Area } from '../../../models/area';
import { AreasService } from '../../../services/crud/areas.service';
import { Observable } from 'rxjs';
import { MapStyles } from '../../../enums/map-styles';
import { Grade } from '../../../models/scale';

@Component({
  selector: 'lc-area-info',
  templateUrl: './area-info.component.html',
  styleUrls: ['./area-info.component.scss'],
})
export class AreaInfoComponent implements OnInit {
  public area: Area;
  public fetchAreaGrades: Observable<Grade[]>;

  constructor(
    private route: ActivatedRoute,
    private areasService: AreasService,
  ) {}

  ngOnInit() {
    const areaSlug = this.route.snapshot.paramMap.get('area-slug');
    this.areasService.getArea(areaSlug).subscribe((area) => {
      this.area = area;
    });
    this.fetchAreaGrades = this.areasService.getAreaGrades(areaSlug);
  }

  protected readonly MapStyles = MapStyles;
}
