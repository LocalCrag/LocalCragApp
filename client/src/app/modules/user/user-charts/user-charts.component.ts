import { Component } from '@angular/core';
import { GradeDistributionBarChartComponent } from '../../shared/components/grade-distribution-bar-chart/grade-distribution-bar-chart.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { Area } from '../../../models/area';
import { Observable } from 'rxjs';
import { Grade } from '../../../utility/misc/grades';
import { ActivatedRoute } from '@angular/router';
import { AreasService } from '../../../services/crud/areas.service';
import { UsersService } from '../../../services/crud/users.service';
import { User } from '../../../models/user';

@Component({
  selector: 'lc-user-charts',
  standalone: true,
  imports: [GradeDistributionBarChartComponent, TranslocoDirective],
  templateUrl: './user-charts.component.html',
  styleUrl: './user-charts.component.scss',
})
export class UserChartsComponent {
  public user: User;
  public fetchUserGrades: Observable<Grade[]>;

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
