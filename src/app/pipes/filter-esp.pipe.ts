import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterEsp',
  standalone: true
})
export class FilterEspPipe implements PipeTransform {

  transform(turnos: any[], filtro: string): any[] {
    if (!filtro) return turnos;

    const filtroLower = filtro.toLowerCase();

    return turnos.filter(turno => {
      
      const matchGeneral = turno.especialidad?.toLowerCase().includes(filtroLower) ||
        turno.especialista?.nombre?.toLowerCase().includes(filtroLower) ||
        turno.especialista?.apellido?.toLowerCase().includes(filtroLower) ||
        turno.estado?.toLowerCase().includes(filtroLower) ||
        turno.comentario?.toLowerCase().includes(filtroLower);

      if (matchGeneral) return true;

      
      const fecha = turno.fechaHora instanceof Date
        ? turno.fechaHora.toLocaleDateString('es-ES')
        : turno.fechaHora?.toDate?.()?.toLocaleDateString('es-ES');
      const matchFecha = fecha?.toLowerCase().includes(filtroLower);

      if (matchFecha) return true;

    
      const matchHora = turno.horaInicio?.toLowerCase().includes(filtroLower);

      if (matchHora) return true;

      
      const historiaClinica = turno.historiaClinica;
      if (!historiaClinica) return false;

      const matchHistoriaClinica = (
        historiaClinica.altura?.toString().includes(filtroLower) ||
        historiaClinica.peso?.toString().includes(filtroLower) ||
        historiaClinica.temperatura?.toString().includes(filtroLower) ||
        historiaClinica.presion?.toLowerCase().includes(filtroLower) ||
        historiaClinica.datosDinamicos?.some((dato: any) =>
          dato.clave?.toLowerCase().includes(filtroLower) ||
          dato.valor?.toLowerCase().includes(filtroLower)
        )
      );

      return matchHistoriaClinica;
    });
  }
}