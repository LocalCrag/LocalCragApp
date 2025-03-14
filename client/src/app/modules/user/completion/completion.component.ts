import { Component, HostListener, OnInit } from '@angular/core';
import { StatisticsService } from '../../../services/crud/statistics.service';
import { ActivatedRoute } from '@angular/router';
import { UsersService } from '../../../services/crud/users.service';
import { User } from '../../../models/user';
import { switchMap } from 'rxjs/operators';
import { MenuItemsService } from '../../../services/crud/menu-items.service';
import { ScalesService } from '../../../services/crud/scales.service';
import { Crag } from '../../../models/crag';
import { forkJoin } from 'rxjs';
import { Completion } from '../../../models/statistics';
import { Area } from '../../../models/area';
import { Sector } from '../../../models/sector';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectItem } from 'primeng/api';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { CompletionProgressBarComponent } from '../completion-progress-bar/completion-progress-bar.component';
import { AccordionModule } from 'primeng/accordion';
import { ExpandButtonComponent } from '../../shared/components/expand-button/expand-button.component';
import { SliderLabelsComponent } from '../../shared/components/slider-labels/slider-labels.component';
import { SliderModule } from 'primeng/slider';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';
import { LineType } from '../../../enums/line-type';
import { RegionService } from '../../../services/crud/region.service';
import { SharedModule } from '../../shared/shared.module';
import { Select } from 'primeng/select';
import { Message } from 'primeng/message';

@Component({
  selector: 'lc-completion',
  standalone: true,
  imports: [
    ProgressBarModule,
    SharedModule,
    NgIf,
    CompletionProgressBarComponent,
    AccordionModule,
    NgForOf,
    ExpandButtonComponent,
    SliderLabelsComponent,
    SliderModule,
    FormsModule,
    TranslocoDirective,
    AsyncPipe,
    Select,
    Message,
  ],
  templateUrl: './completion.component.html',
  styleUrl: './completion.component.scss',
})
export class CompletionComponent implements OnInit {
  private user: User;

  public crags: Crag[];
  public completion: Completion;
  public cragMap: Map<string, Crag> = new Map<string, Crag>();
  public sectorMap: Map<string, Sector> = new Map<string, Sector>();
  public areaMap: Map<string, Area> = new Map<string, Area>();
  public regionExpanded = true;
  public expandedCrags: Set<string> = new Set<string>();
  public expandedSectors: Set<string> = new Set<string>();

  public listenForSliderStop = false;
  public availableScales: SelectItem<
    { lineType: LineType; gradeScale: string } | undefined
  >[] = [];
  public scaleKey: SelectItem<
    { lineType: LineType; gradeScale: string } | undefined
  >;
  public minGradeValue = 0; // Skip project grades
  public maxGradeValue = null;
  public gradeFilterRange = [this.minGradeValue, this.maxGradeValue];

  constructor(
    private statisticsService: StatisticsService,
    private usersService: UsersService,
    private route: ActivatedRoute,
    private menuItemsService: MenuItemsService,
    private regionService: RegionService,
    private translocoService: TranslocoService,
    protected scalesService: ScalesService,
  ) {}

  @HostListener('document:touchend')
  @HostListener('document:mouseup')
  reloadAfterSliderStop() {
    if (this.listenForSliderStop) {
      this.loadCompletion();
    }
  }

  ngOnInit() {
    const userSlug =
      this.route.snapshot.parent.parent.paramMap.get('user-slug');
    this.usersService
      .getUser(userSlug)
      .pipe(
        switchMap((user) => {
          this.user = user;
          return forkJoin({
            menuItems: this.menuItemsService.getCragMenuStructure(),
            gradeDistribution: this.regionService.getRegionGrades(),
          });
        }),
      )
      .subscribe(({ menuItems, gradeDistribution }) => {
        this.crags = menuItems;
        this.crags.map((crag) => {
          this.cragMap.set(crag.id, crag);
          crag.sectors.map((sector) => {
            this.sectorMap.set(sector.id, sector);
            sector.areas.map((area) => {
              this.areaMap.set(area.id, area);
            });
          });
        });

        this.availableScales.push({
          label: this.translocoService.translate('ALL'),
          value: undefined,
        });
        for (const lineType in gradeDistribution) {
          for (const gradeScale in gradeDistribution[lineType]) {
            if (gradeDistribution[lineType][gradeScale]) {
              this.availableScales.push({
                label: `${this.translocoService.translate(lineType)} ${gradeScale}`,
                value: { lineType: lineType as LineType, gradeScale },
              });
            }
          }
        }
        if (this.availableScales.length <= 2) {
          this.scaleKey = this.availableScales[1]; // Default: Select first scale, so range slider is available
        } else {
          this.scaleKey = this.availableScales[0]; // Default: Select "ALL" if multiple scales are available
        }
        this.selectScale();
      });
  }

  selectScale() {
    if (this.scaleKey?.value) {
      this.scalesService
        .getScale(this.scaleKey.value.lineType, this.scaleKey.value.gradeScale)
        .subscribe((scale) => {
          this.maxGradeValue = Math.max(
            ...scale.grades.map((grade) => grade.value),
          );
          this.gradeFilterRange = [0, this.maxGradeValue];
        });
    }
    this.loadCompletion();
  }

  private loadCompletion() {
    const filters = new URLSearchParams({
      user_id: this.user.id,
    });
    if (this.gradeFilterRange[1] !== null) {
      filters.set('min_grade', this.gradeFilterRange[0]);
      filters.set('max_grade', this.gradeFilterRange[1]);
    }
    if (this.scaleKey?.value) {
      filters.set('line_type', this.scaleKey.value.lineType);
      filters.set('grade_scale', this.scaleKey.value.gradeScale);
    }
    return this.statisticsService
      .getCompletion(`?${filters.toString()}`)
      .subscribe((completion) => {
        this.completion = completion;
      });
  }

  public addOrRemove(set: Set<string>, id: string) {
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
  }

  protected readonly Object = Object;
}
