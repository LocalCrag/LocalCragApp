import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {CragsService} from '../../../services/crud/crags.service';
import {Crag} from '../../../models/crag';

@Component({
  selector: 'lc-crag-info',
  templateUrl: './crag-info.component.html',
  styleUrls: ['./crag-info.component.scss']
})
export class CragInfoComponent implements OnInit {

  public crag: Crag;

  constructor(private route: ActivatedRoute,
              private cragsService: CragsService) {
  }

  ngOnInit() {
    const cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    this.cragsService.getCrag(cragSlug).subscribe(crag => {
      this.crag = crag;
    });
  }

}
