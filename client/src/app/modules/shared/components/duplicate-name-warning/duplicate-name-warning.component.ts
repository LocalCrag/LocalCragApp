import {
  Component,
  DestroyRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Message } from 'primeng/message';
import { TranslocoDirective } from '@jsverse/transloco';
import { Observable, of, BehaviorSubject, combineLatest } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Crag } from '../../../../models/crag';
import { Sector } from '../../../../models/sector';
import { Area } from '../../../../models/area';
import { Line } from '../../../../models/line';
import { LineGradePipe } from '../../pipes/line-grade.pipe';

type TopoEntity = Crag | Sector | Area | Line;

/**
 * Non-blocking warn alert when a topo name already exists system-wide.
 * Does not mark the form control invalid — duplicates are allowed.
 */
@Component({
  selector: 'lc-duplicate-name-warning',
  imports: [Message, TranslocoDirective, LineGradePipe],
  templateUrl: './duplicate-name-warning.component.html',
})
export class DuplicateNameWarningComponent implements OnInit, OnChanges {
  @Input({ required: true }) nameControl: AbstractControl;
  @Input() excludeId: string | null = null;
  @Input({ required: true }) entityType: 'crag' | 'sector' | 'area' | 'line';
  @Input({ required: true }) findByName: (
    name: string,
    excludeId?: string | null,
  ) => Observable<TopoEntity[]>;

  public matches: TopoEntity[] = [];

  private destroyRef = inject(DestroyRef);
  private excludeId$ = new BehaviorSubject<string | null>(null);

  get messageKey(): string {
    return `${this.entityType}Message`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['excludeId']) {
      this.excludeId$.next(this.excludeId);
    }
  }

  ngOnInit(): void {
    this.excludeId$.next(this.excludeId);

    combineLatest([
      this.nameControl.valueChanges.pipe(
        startWith(this.nameControl.value),
        debounceTime(300),
        distinctUntilChanged(),
      ),
      this.excludeId$,
    ])
      .pipe(
        switchMap(([name, excludeId]) => {
          const normalized = typeof name === 'string' ? name.trim() : '';
          if (!normalized) {
            return of([] as TopoEntity[]);
          }
          return this.findByName(normalized, excludeId).pipe(
            map((matches) => matches.filter((match) => !!match.routerLink)),
            catchError(() => of([] as TopoEntity[])),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((matches) => {
        this.matches = matches;
      });
  }

  asLine(match: TopoEntity): Line {
    return match as Line;
  }

  matchLabel(match: TopoEntity): string {
    switch (this.entityType) {
      case 'crag':
        return match.name;
      case 'sector': {
        const sector = match as Sector;
        return sector.crag?.name
          ? `${sector.crag.name} / ${sector.name}`
          : sector.name;
      }
      case 'area': {
        const area = match as Area;
        const cragName = area.sector?.crag?.name;
        const sectorName = area.sector?.name;
        if (cragName && sectorName) {
          return `${cragName} / ${sectorName} / ${area.name}`;
        }
        return area.name;
      }
      case 'line': {
        const line = match as Line;
        const cragName = line.area?.sector?.crag?.name;
        const sectorName = line.area?.sector?.name;
        const areaName = line.area?.name;
        if (cragName && sectorName && areaName) {
          return `${cragName} / ${sectorName} / ${areaName} / ${line.name}`;
        }
        return line.name;
      }
    }
  }
}
