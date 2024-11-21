import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterPac',
  standalone: true
})
export class FilterPacPipe implements PipeTransform {
  transform(turnos: any[], filtro: string): any[] {
    if (!filtro) return turnos;

    const filtroLower = filtro.toLowerCase();

    return turnos.filter(turno => {
      // Filtrar por campos del turno principal
      const camposTurno = [
        turno.especialidad?.toLowerCase(),
        turno.paciente?.nombre?.toLowerCase(),
        turno.paciente?.apellido?.toLowerCase(),
        turno.estado?.toLowerCase(),
        turno.horaInicio?.toLowerCase(),
        turno.fechaHora ? new Date(turno.fechaHora).toLocaleDateString('es-ES').toLowerCase() : null
      ];

      // Filtrar por campos fijos de la historia clínica
      const historiaClinicaFijos = turno.historiaClinica
        ? [
            turno.historiaClinica.altura?.toString(),
            turno.historiaClinica.peso?.toString(),
            turno.historiaClinica.temperatura?.toString(),
            turno.historiaClinica.presion?.toString()
          ]
        : [];

      // Filtrar por datos dinámicos de la historia clínica
      const historiaClinicaDinamicos = turno.historiaClinica?.datosDinamicos
        ? turno.historiaClinica.datosDinamicos.map(
            (dato: { clave: string; valor: string }) =>
              `${dato.clave?.toLowerCase()} ${dato.valor?.toLowerCase()}`
          )
        : [];

      // Combinar todos los campos en una sola lista y verificar si alguno incluye el filtro
      const todosLosCampos = [...camposTurno, ...historiaClinicaFijos, ...historiaClinicaDinamicos];
      return todosLosCampos.some(campo => campo?.includes(filtroLower));
    });
  }
}

/*import { Pipe, PipeTransform } from '@angular/core';

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
}*/