import { Component } from '@angular/core';
import {Area} from '../../../models/area';
import {ActivatedRoute} from '@angular/router';
import {AreasService} from '../../../services/crud/areas.service';
import {Line} from '../../../models/line';
import {LinesService} from '../../../services/crud/lines.service';

@Component({
  selector: 'lc-line-info',
  templateUrl: './line-info.component.html',
  styleUrls: ['./line-info.component.scss']
})
export class LineInfoComponent {

  public line: Line;

  constructor(private route: ActivatedRoute,
              private linesService: LinesService) {
  }

  ngOnInit() {
    const lineSlug = this.route.snapshot.paramMap.get('line-slug');
    this.linesService.getLine(lineSlug).subscribe(line => {
      this.line = line;
    });
  }

}
