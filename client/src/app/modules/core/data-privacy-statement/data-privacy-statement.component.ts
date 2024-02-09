import {Component, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {TranslocoService} from '@ngneat/transloco';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'lc-data-privacy-statement',
  templateUrl: './data-privacy-statement.component.html',
  styleUrls: ['./data-privacy-statement.component.scss']
})
export class DataPrivacyStatementComponent implements OnInit{

  constructor(private title: Title,
              private translocoService: TranslocoService) {
  }

  ngOnInit() {
    this.title.setTitle(`${this.translocoService.translate(marker('dataPrivacyStatementBrowserTitle'))} - ${environment.instanceName}`)
  }

}
