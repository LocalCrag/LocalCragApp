import {Component, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {TranslocoService} from '@ngneat/transloco';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'lc-imprint',
  templateUrl: './imprint.component.html',
  styleUrls: ['./imprint.component.scss']
})
export class ImprintComponent implements OnInit{

  constructor(private title: Title,
              private translocoService: TranslocoService) {
  }

  ngOnInit() {
    this.title.setTitle(`${this.translocoService.translate(marker('imprintBrowserTitle'))} - ${environment.instanceName}`)
  }

}
