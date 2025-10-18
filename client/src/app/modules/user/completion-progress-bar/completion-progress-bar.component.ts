import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { ProgressBarModule } from 'primeng/progressbar';
import { Completion } from '../../../models/statistics';
import { Crag } from '../../../models/crag';
import { Sector } from '../../../models/sector';
import { Area } from '../../../models/area';
import { RegionService } from '../../../services/crud/region.service';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

type ItemProgress = {
  progress: number;
  totalLines: number;
  totalAscents: number;
};

@Component({
  selector: 'lc-completion-progress-bar',
  imports: [NgIf, ProgressBarModule, AsyncPipe],
  templateUrl: './completion-progress-bar.component.html',
  styleUrl: './completion-progress-bar.component.scss',
})
export class CompletionProgressBarComponent implements OnInit, OnChanges {
  @Input() completion: Completion;
  @Input() cragMap: Map<string, Crag>;
  @Input() sectorMap: Map<string, Sector>;
  @Input() areaMap: Map<string, Area>;
  @Input() level: 'region' | 'crag' | 'sector' | 'area' = 'region';
  @Input() id: string = null;

  public itemProgress: ItemProgress;
  public itemName: Observable<string>;

  private regionService = inject(RegionService);

  ngOnInit() {
    this.itemProgress = this.getItemProgress(this.level, this.id);
    this.itemName = this.getItemName(this.level, this.id);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.completion) {
      this.itemProgress = this.getItemProgress(this.level, this.id);
    }
  }

  public getTotalLinesForLevel(
    level: 'region' | 'crag' | 'sector' | 'area',
    id: string,
  ): number {
    if (level === 'region') {
      if (
        !this.completion.crags ||
        Object.keys(this.completion.crags).length === 0
      ) {
        return 0;
      }
      return Object.values(this.completion.crags).reduce(
        (sum, crag) => sum + crag.totalLines,
        0,
      );
    }
    if (level === 'crag') {
      if (!this.completion.crags[id]) {
        return 0;
      }
      return this.completion.crags[id].totalLines;
    }
    if (level === 'sector') {
      if (!this.completion.sectors[id]) {
        return 0;
      }
      return this.completion.sectors[id].totalLines;
    }
    if (level === 'area') {
      if (!this.completion.areas[id]) {
        return 0;
      }
      return this.completion.areas[id].totalLines;
    }
    return 0;
  }

  public getTotalAscentsForLevel(
    level: 'region' | 'crag' | 'sector' | 'area',
    id: string,
  ): number {
    if (level === 'region') {
      return Object.values(this.completion.crags).reduce(
        (sum, crag) => sum + crag.ascents,
        0,
      );
    }
    if (level === 'crag') {
      return this.completion.crags[id].ascents;
    }
    if (level === 'sector') {
      return this.completion.sectors[id].ascents;
    }
    if (level === 'area') {
      return this.completion.areas[id].ascents;
    }
    return null;
  }

  public getItemProgress(
    level: 'region' | 'crag' | 'sector' | 'area',
    id: string,
  ): ItemProgress {
    const totalLines = this.getTotalLinesForLevel(level, id);
    const totalAscents =
      (totalLines && this.getTotalAscentsForLevel(level, id)) || 0;
    const progress = Math.round((totalAscents / totalLines) * 100);
    return { progress, totalLines, totalAscents };
  }

  public getItemName(
    level: 'region' | 'crag' | 'sector' | 'area',
    id: string,
  ): Observable<string> {
    if (level === 'region') {
      return this.regionService.getRegion().pipe(map((region) => region.name));
    }
    if (level === 'crag') {
      return of(this.cragMap.get(id).name);
    }
    if (level === 'sector') {
      return of(this.sectorMap.get(id).name);
    }
    if (level === 'area') {
      return of(this.areaMap.get(id).name);
    }
    return null;
  }
}
