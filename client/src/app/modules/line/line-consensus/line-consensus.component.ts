import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { Rating } from 'primeng/rating';
import { Subscription, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { Line } from '../../../models/line';
import { ScalesService } from '../../../services/crud/scales.service';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';
import {
  GradeVoteBar,
  RatingRow,
  buildGradeVoteBars,
  buildRatingRows,
} from './line-consensus';

/**
 * Community grade diagram and expandable star-rating breakdown for one line.
 */
@Component({
  selector: 'lc-line-consensus',
  templateUrl: './line-consensus.component.html',
  styleUrl: './line-consensus.component.scss',
  imports: [TranslocoDirective, Rating, FormsModule, LineGradePipe],
})
export class LineConsensusComponent implements OnChanges, OnDestroy {
  @Input() line: Line;
  @Input() displayUserGrades?: boolean;
  @Input() displayUserRating?: boolean;

  public ratingsOpen = false;
  public gradeNames: Record<number, string> = {};

  private namesSub: Subscription | null = null;
  private scalesService = inject(ScalesService);

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['line']) {
      return;
    }
    const previous = changes['line'].previousValue as Line | undefined;
    if (previous?.id !== this.line?.id) {
      this.ratingsOpen = false;
    }
    this.loadGradeNames();
  }

  ngOnDestroy() {
    this.namesSub?.unsubscribe();
  }

  get gradeBars(): GradeVoteBar[] {
    return buildGradeVoteBars(
      this.line?.gradeVotes?.votes,
      this.gradeNames,
      this.line?.userGradeValue ?? null,
    );
  }

  get showGradeDiagram(): boolean {
    return (this.line?.ascentCount ?? 0) > 0 && this.gradeBars.length > 0;
  }

  get showSimpleGrade(): boolean {
    return (this.line?.ascentCount ?? 0) > 0 && !this.showGradeDiagram;
  }

  get ratingRows(): RatingRow[] {
    return buildRatingRows(this.line?.ratingDistribution?.distribution);
  }

  get ratingCount(): number {
    return this.line?.ratingDistribution?.count ?? 0;
  }

  get displayedRating(): number | null {
    if (!this.line) {
      return null;
    }
    return this.displayUserRating
      ? this.line.userRating
      : this.line.authorRating;
  }

  get ratingBreakdownId(): string {
    return `line-rating-${this.line?.id ?? 'unknown'}`;
  }

  toggleRatings() {
    this.ratingsOpen = !this.ratingsOpen;
  }

  private loadGradeNames() {
    this.namesSub?.unsubscribe();
    this.gradeNames = {};
    if (!this.line?.type || !this.line.gradeScale) {
      return;
    }
    this.namesSub = this.scalesService
      .gradeNameByValueMap(this.line.type, this.line.gradeScale)
      .pipe(
        take(1),
        catchError(() => of({})),
      )
      .subscribe((names) => {
        this.gradeNames = names ?? {};
      });
  }
}
