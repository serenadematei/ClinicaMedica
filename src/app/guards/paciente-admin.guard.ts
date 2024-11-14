import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';
import Swal from 'sweetalert2';

export const pacienteAdminGuard: CanActivateFn = (route, state) => {
  
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!localStorage.getItem('userRole')) {
    return authService.getUserRole().pipe(
      map(role => {
        if (role === 'admin' || role === 'paciente') {
          localStorage.setItem('userRole', role);
          return true;
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Acceso denegado',
            text: 'Solo los usuarios con el rol de "paciente" o "admin" pueden acceder a esta página.',
          }).then(() => {
            router.navigateByUrl('/home'); 
          });
          return false;
        }
      })
    );
  } else {
    const role = localStorage.getItem('userRole');
    if (role === 'admin'|| role === 'paciente') {
      return true;
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Acceso denegado',
        text: 'Solo los usuarios con el rol de "paciente" o "admin" pueden acceder a esta página.',
      }).then(() => {
        router.navigateByUrl('/home'); 
      });
      return false;
    }
  }
};