import {Component, HostBinding, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {TranslocoService} from '@ngneat/transloco';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {environment} from '../../../../environments/environment';
import {LoadingState} from '../../../enums/loading-state';
import {Router} from '@angular/router';

/**
 * A 404 error page.
 */
@Component({
  selector: 'lc-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent implements OnInit{

  @HostBinding('class.auth-view') authView: boolean = true;

  public url: string;

  constructor(private title: Title,
              private translocoService: TranslocoService) {
  }

  ngOnInit() {
    this.url = window.location.href;
    this.title.setTitle(`${this.translocoService.translate(marker('notFoundPageBrowserTitle'))} - ${environment.instanceName}`)
  }

}
