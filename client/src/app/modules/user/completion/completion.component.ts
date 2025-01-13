import { Component, HostListener, OnInit } from '@angular/core';
import { StatisticsService } from '../../../services/crud/statistics.service';
import { ActivatedRoute } from '@angular/router';
import { UsersService } from '../../../services/crud/users.service';
import { User } from '../../../models/user';
import { map, switchMap } from 'rxjs/operators';
import { MenuItemsService } from '../../../services/crud/menu-items.service';
import { Crag } from '../../../models/crag';
import { forkJoin } from 'rxjs';
import { Completion } from '../../../models/statistics';
import { Area } from '../../../models/area';
import { Sector } from '../../../models/sector';
import { ProgressBarModule } from 'primeng/progressbar';
import { SharedModule } from 'primeng/api';
import { NgForOf, NgIf } from '@angular/common';
import { CompletionProgressBarComponent } from '../completion-progress-bar/completion-progress-bar.component';
import { AccordionModule } from 'primeng/accordion';
import { ExpandButtonComponent } from '../../shared/components/expand-button/expand-button.component';
import { gradeNameByValue, GRADES } from '../../../utility/misc/grades';
import { SliderLabelsComponent } from '../../shared/components/slider-labels/slider-labels.component';
import { SliderModule } from 'primeng/slider';
import {TranslocoDirective, TranslocoPipe} from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';
import {MessagesModule} from 'primeng/messages';

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
    TranslocoPipe,
    FormsModule,
    MessagesModule,
    TranslocoDirective,
  ],
  templateUrl: './completion.component.html',
  styleUrl: './completion.component.scss',
})
export class CompletionComponent implements OnInit {
  // TODO @BlobbyBob Update grade slider

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
  public minGradeValue = GRADES['FB'][2].value;
  public maxGradeValue = GRADES['FB'].at(-1).value;
  public gradeFilterRange = [this.minGradeValue, this.maxGradeValue];

  constructor(
    private statisticsService: StatisticsService,
    private usersService: UsersService,
    private route: ActivatedRoute,
    private menuItemsService: MenuItemsService,
  ) {}

  @HostListener('document:touchend')
  @HostListener('document:mouseup')
  reloadAfterSliderStop() {
    if (this.listenForSliderStop) {
      this.loadCompletion().subscribe();
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
            completion: this.loadCompletion(),
          });
        }),
      )
      .subscribe(({ menuItems }) => {
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
      });
  }

  private loadCompletion() {
    const query = `?user_id=${this.user.id}&min_grade=${this.gradeFilterRange[0]}&max_grade=${this.gradeFilterRange[1]}`;
    return this.statisticsService.getCompletion(query).pipe(
      map((completion) => {
        this.completion = completion;
      }),
    );
  }

  public addOrRemove(set: Set<string>, id: string) {
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
  }

  protected readonly gradeNameByValue = gradeNameByValue;
  protected readonly Object = Object;
}
