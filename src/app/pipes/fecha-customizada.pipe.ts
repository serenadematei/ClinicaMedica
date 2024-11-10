import { Pipe, PipeTransform } from '@angular/core';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

@Pipe({
  name: 'fechaCustomizada',
  standalone: true,
})
export class FechaCustomizadaPipe implements PipeTransform {
  transform(value: Date | string): string {
    if (!value) return '';
    const fecha = typeof value === 'string' ? new Date(value) : value;
    return format(fecha, "dd 'de' MMMM 'de' yyyy", { locale: es });
  }
}