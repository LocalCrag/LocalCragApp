import {Component, OnInit} from '@angular/core';
import {TranslocoService} from '@ngneat/transloco';
import {Title} from '@angular/platform-browser';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'lc-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss']
})
export class NewsComponent implements OnInit{

  constructor(private title: Title,
              private translocoService: TranslocoService) {
  }

  ngOnInit() {
    this.title.setTitle(`${this.translocoService.translate(marker('newsBrowserTitle'))} - ${environment.instanceName}`)
  }

}
