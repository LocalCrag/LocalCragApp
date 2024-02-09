import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {CragsService} from '../../../services/crud/crags.service';
import {Crag} from '../../../models/crag';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';

/**
 * Component that shows information about a crag.
 */
@Component({
  selector: 'lc-crag-info',
  templateUrl: './crag-info.component.html',
  styleUrls: ['./crag-info.component.scss']
})
@UntilDestroy()
export class CragInfoComponent implements OnInit {

  public crag: Crag;

  constructor(private route: ActivatedRoute,
              private cragsService: CragsService) {
  }

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(params => {
      this.crag = null;
      const cragSlug = params.get('crag-slug');
      this.cragsService.getCrag(cragSlug).subscribe(crag => {
        this.crag = crag;
      });
    })
  }


}
