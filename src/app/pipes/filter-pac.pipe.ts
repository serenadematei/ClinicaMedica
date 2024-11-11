import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterPac',
  standalone: true
})
export class FilterPacPipe implements PipeTransform {
  transform(turnos: any[], filtro: string): any[] {
    if (!filtro) return turnos;

    const filtroLower = filtro.toLowerCase();

    return turnos.filter(turno =>
      turno.especialidad?.toLowerCase().includes(filtroLower) ||
      turno.paciente?.nombre?.toLowerCase().includes(filtroLower) ||
      turno.paciente?.apellido?.toLowerCase().includes(filtroLower)
    );
  }
}