import { Component } from '@angular/core';
import {FormBuilder} from '@angular/forms';
import {DialogService, DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {Store} from '@ngrx/store';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {AscentsService} from '../../../services/crud/ascents.service';
import {TranslocoService} from '@ngneat/transloco';
import {ConfirmationService} from 'primeng/api';
import {Line} from '../../../models/line';

@Component({
  selector: 'lc-ascent-form-title',
  standalone: true,
  imports: [],
  templateUrl: './ascent-form-title.component.html',
  styleUrl: './ascent-form-title.component.scss'
})
export class AscentFormTitleComponent {

  public line: Line;

  constructor(private dialogConfig: DynamicDialogConfig,
              public ref: DynamicDialogRef) {
    this.line = this.dialogConfig.data.line;
  }

}
