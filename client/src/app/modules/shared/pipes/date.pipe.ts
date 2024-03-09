import {Pipe, PipeTransform} from '@angular/core';
import { format } from "date-fns";

/**
 * Formats a date with the given formatting string.
 */
@Pipe({
  name: 'date'
})
export class DatePipe implements PipeTransform {

  /**
   * Transforms the input value by formatting the Date with the given formatting string.
   *
   * @param value Date to format.
   * @param  formattingString Formatting string.
   * @return Formatted Date.
   */
  transform(value:Date, formattingString: string): string {
    if (value) {
      return format(value, formattingString)
    } else {
      return '';
    }
  }

}
