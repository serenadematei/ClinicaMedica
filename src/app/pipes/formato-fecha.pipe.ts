import { Pipe, PipeTransform } from '@angular/core';
import { format, isValid, parse } from 'date-fns';

@Pipe({
  name: 'formatoFechaHora',
  standalone: true
})
export class FormatoFechaPipe implements PipeTransform {

  transform(value: Date | string): string {
    const date = typeof value === 'string' ? new Date(value) : value;
    return format(date, 'yyyy-MM-dd');
  }

}