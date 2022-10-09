import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MomentPipe} from './pipes/moment.pipe';



@NgModule({
  declarations: [MomentPipe],
  imports: [
    CommonModule
  ],
  exports: [
    MomentPipe
  ]
})
export class SharedModule { }
