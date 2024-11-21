import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roleIcon',
  standalone: true,
})
export class RoleIconPipe implements PipeTransform {
  transform(role: string): string {
    switch (role) {
      case 'admin':
        return '- Administrador ⚙️'; 
      case 'especialista':
        return '- Especialista 🩺'; 
      case 'paciente':
        return '- Paciente 👤'; 
      default:
        return '❓'; 
    }
  }
}