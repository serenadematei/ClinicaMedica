import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterEsp',
  standalone: true
})
export class FilterEspPipe implements PipeTransform {

  transform(items: any[], searchText: string): any[] {
    if (!items || !searchText) {
      return items;
    }

    searchText = searchText.toLowerCase();

    return items.filter((item) => {

      let fechaHora: Date | null = null;

      if (item.fechaHora) {
        if (item.fechaHora instanceof Date) {
          fechaHora = item.fechaHora;
        } else if (item.fechaHora.seconds) {
          fechaHora = new Date(item.fechaHora.seconds * 1000);
        } else if (typeof item.fechaHora === 'string') {
          fechaHora = new Date(item.fechaHora);
        }
      }

      const formattedDate = fechaHora ? fechaHora.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '';
      const formattedDateTime = fechaHora ? fechaHora.toLocaleString() : '';
      
      return (
        (item.nombre && item.nombre.toLowerCase().includes(searchText)) ||
        (item.apellido && item.apellido.toLowerCase().includes(searchText)) ||
        (item.especialidad && item.especialidad.toLowerCase().includes(searchText)) ||
        (item.otraEspecialidad && item.otraEspecialidad.toLowerCase().includes(searchText))||
        (item.estado && item.estado.toLowerCase().includes(searchText)) ||
        (item.comentario && item.comentario.toLowerCase().includes(searchText)) ||
        (item.comentarioCalificacion && item.comentarioCalificacion.toLowerCase().includes(searchText)) ||
        (item.motivoCancelacion && item.motivoCancelacion.toLowerCase().includes(searchText)) ||
        (item.horaInicio && item.horaInicio.toLowerCase().includes(searchText)) ||
        (item.horaFin && item.horaFin.toLowerCase().includes(searchText)) ||
        (formattedDateTime && formattedDateTime.toLowerCase().includes(searchText)) ||
        (formattedDate && formattedDate.toLowerCase().includes(searchText))
      );
    });
  }

}