import { Component, OnInit } from '@angular/core';
import { GradeDistributionBarChartComponent } from '../../shared/components/grade-distribution-bar-chart/grade-distribution-bar-chart.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { UsersService } from '../../../services/crud/users.service';
import { User } from '../../../models/user';
import { CompletionComponent } from '../completion/completion.component';
import { GradeDistribution } from '../../../models/scale';

@Component({
  selector: 'lc-user-charts',
  standalone: true,
  imports: [
    GradeDistributionBarChartComponent,
    TranslocoDirective,
    CompletionComponent,
  ],
  templateUrl: './user-charts.component.html',
  styleUrl: './user-charts.component.scss',
})
export class UserChartsComponent implements OnInit {
  public user: User;
  public fetchUserGrades: Observable<GradeDistribution>;

  constructor(
    private route: ActivatedRoute,
    private usersService: UsersService,
  ) {}

  ngOnInit() {
    const userSlug =
      this.route.snapshot.parent.parent.paramMap.get('user-slug');
    this.usersService.getUser(userSlug).subscribe((user) => {
      this.user = user;
    });
    this.fetchUserGrades = this.usersService.getUserGrades(userSlug);
  }
}
