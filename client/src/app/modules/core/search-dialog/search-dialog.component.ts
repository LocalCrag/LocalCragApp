import { Component, ViewEncapsulation } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { SearchService } from '../../../services/crud/search.service';
import { Searchable } from '../../../models/searchable';
import { NgForOf, NgIf } from '@angular/common';
import { debounceTime, Subject } from 'rxjs';
import { AvatarModule } from 'primeng/avatar';
import { NavigationEnd, Router } from '@angular/router';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SearchableComponent } from '../searchable/searchable.component';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lc-search-dialog',
  imports: [
    InputTextModule,
    FormsModule,
    TranslocoDirective,
    NgIf,
    NgForOf,
    AvatarModule,
    ButtonModule,
    MessageModule,
    SearchableComponent,
    InputGroup,
    InputGroupAddon,
  ],
  templateUrl: './search-dialog.component.html',
  styleUrl: './search-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class SearchDialogComponent {
  public query: string;
  public searchables: Searchable[];
  public loading = false;
  private queryUpdate = new Subject<any>();

  constructor(
    private searchService: SearchService,
    private router: Router,
    private ref: DynamicDialogRef,
  ) {
    this.queryUpdate.pipe(debounceTime(400)).subscribe(() => {
      if (this.query) {
        this.searchService.search(this.query).subscribe((searchables) => {
          this.searchables = searchables;
          this.loading = false;
        });
      } else {
        this.searchables = [];
        this.loading = false;
      }
    });
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.ref.close();
      }
    });
  }

  search() {
    this.loading = true;
    this.queryUpdate.next(null);
  }

  close() {
    this.ref.close();
  }
}
