import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
  name: 'filterEsp',
  standalone: true
})
export class FilterEspPipe implements PipeTransform {

  transform(turnos: any[], filtro: string): any[] {
      if (!filtro) return turnos;
  
      const filtroLower = filtro.toLowerCase();
      
      return turnos.filter(turno => 
        turno.especialidad?.toLowerCase().includes(filtroLower) || 
        turno.especialista?.nombre?.toLowerCase().includes(filtroLower) ||
        turno.especialista?.apellido?.toLowerCase().includes(filtroLower)
      );
    }

}