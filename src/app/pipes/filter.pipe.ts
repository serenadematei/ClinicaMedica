import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {

  transform(items: any[], searchText: string): any[] {
    if (!items || !searchText) {
      return items;
    }

    searchText = searchText.toLowerCase();

    return items.filter((item) => {
      // Check the top-level fields
      const matchTopLevel = (field: any) => field && field.toString().toLowerCase().includes(searchText);

      // Check the nested fields within 'pacientes'
      const matchPacienteFields = (paciente: any) => {
        return paciente && (
          matchTopLevel(paciente.altura) ||
          matchTopLevel(paciente.peso) ||
          matchTopLevel(paciente.temperatura) ||
          matchTopLevel(paciente.presion) ||
          (paciente.datosDinamicos && paciente.datosDinamicos.some((data: any) => matchTopLevel(data.clave) || matchTopLevel(data.valor)))
        );
      };

      return (
        matchTopLevel(item.nombre) ||
        matchTopLevel(item.apellido) ||
        matchTopLevel(item.edad) ||
        matchTopLevel(item.dni) ||
        matchTopLevel(item.obrasocial) ||
        matchTopLevel(item.role) ||
        matchTopLevel(item.mail) ||
        matchTopLevel(item.especialidad) ||
        matchTopLevel(item.otraEspecialidad) ||
        (item.especialistas && (matchTopLevel(item.especialistas.nombre) || matchTopLevel(item.especialistas.apellido))) ||
        (item.paciente && (matchTopLevel(item.paciente.nombre) || matchTopLevel(item.paciente.apellido))) ||
        (item.pacientes && matchPacienteFields(item.pacientes))
      );
    });
  }
}