import {Pipe, PipeTransform} from '@angular/core';
import * as moment from 'moment';

/**
 * Formats a moment with the given formatting string.
 */
@Pipe({
  name: 'moment'
})
export class MomentPipe implements PipeTransform {

  /**
   * Transforms the input value by formatting the moment DateTime with the given formatting string.
   *
   * @param value Date to format.
   * @param  formattingString Formatting string.
   * @return Formatted moment.
   */
  transform(value: moment.Moment, formattingString: string): string {
    if (value) {
      return value.format(formattingString);
    } else {
      return '';
    }
  }

}
