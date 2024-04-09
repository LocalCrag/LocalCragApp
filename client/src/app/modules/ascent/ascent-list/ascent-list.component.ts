import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {BreadcrumbModule} from 'primeng/breadcrumb';
import {CardModule} from 'primeng/card';
import {AsyncPipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {TabMenuModule} from 'primeng/tabmenu';
import {TranslocoDirective, TranslocoPipe, TranslocoService} from '@ngneat/transloco';
import {AscentsService} from '../../../services/crud/ascents.service';
import {Ascent} from '../../../models/ascent';
import {ButtonModule} from 'primeng/button';
import {DataViewModule} from 'primeng/dataview';
import {DropdownModule} from 'primeng/dropdown';
import {HasPermissionDirective} from '../../shared/directives/has-permission.directive';
import {SharedModule} from '../../shared/shared.module';
import {LoadingState} from '../../../enums/loading-state';
import {FormsModule} from '@angular/forms';
import {PrimeIcons, SelectItem} from 'primeng/api';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {LineModule} from '../../line/line.module';
import {RatingModule} from 'primeng/rating';
import {AvatarModule} from 'primeng/avatar';
import {UpgradePipe} from '../pipes/upgrade.pipe';
import {DowngradePipe} from '../pipes/downgrade.pipe';
import {ConsensusGradePipe} from '../pipes/consensus-grade.pipe';
import {TagModule} from 'primeng/tag';

@Component({
  selector: 'lc-ascent-list',
  standalone: true,
  imports: [
    BreadcrumbModule,
    CardModule,
    NgIf,
    RouterOutlet,
    TabMenuModule,
    TranslocoDirective,
    ButtonModule,
    DataViewModule,
    DropdownModule,
    HasPermissionDirective,
    NgForOf,
    SharedModule,
    FormsModule,
    NgClass,
    ConfirmPopupModule,
    LineModule,
    RatingModule,
    TranslocoPipe,
    AsyncPipe,
    AvatarModule,
    UpgradePipe,
    DowngradePipe,
    ConsensusGradePipe,
    TagModule
  ],
  templateUrl: './ascent-list.component.html',
  styleUrl: './ascent-list.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AscentListComponent implements  OnInit{

  public loadingStates = LoadingState;
  public loading: LoadingState = LoadingState.LOADING;
  public ascents: Ascent[];
  public sortOptions: SelectItem[];
  public sortKey: SelectItem;
  public sortOrder: number;
  public sortField: string;

  constructor(private ascentsService: AscentsService,
              private translocoService :TranslocoService) {

  }

  ngOnInit() {
    this.ascentsService.getAscents().subscribe(ascents => {
      this.ascents = ascents;
      console.log(ascents);
      this.loading = LoadingState.DEFAULT;
      this.sortOptions = [
        {icon: PrimeIcons.SORT_AMOUNT_DOWN_ALT, label: this.translocoService.translate(marker('sortAscending')), value: '!timeCreated'}, // todo use some special ascent date
        {icon: PrimeIcons.SORT_AMOUNT_DOWN, label: this.translocoService.translate(marker('sortDescending')), value: 'timeCreated'}, // todo use some special ascent date
      ];
      this.sortKey = this.sortOptions[0];
    })
  }


  onSortChange(event: any) {
    let value = event.value.value;
    if (value.indexOf('!') === 0) {
      this.sortOrder = 1;
      this.sortField = value.substring(1, value.length);
    } else {
      this.sortOrder = -1;
      this.sortField = value;
    }
  }

}
