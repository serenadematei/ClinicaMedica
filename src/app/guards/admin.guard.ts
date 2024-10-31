import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import Swal from 'sweetalert2';

export const adminGuard: CanActivateFn = (route, state) => {
  
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!localStorage.getItem('userRole')) {
    return authService.getUserRole().pipe(
      map(role => {
        if (role === 'admin') {
          localStorage.setItem('userRole', role);
          return true;
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Acceso denegado',
            text: 'Solo los usuarios con el rol de "admin" pueden acceder a esta página.',
          }).then(() => {
            router.navigateByUrl('/home'); 
          });
          return false;
        }
      })
    );
  } else {
    const role = localStorage.getItem('userRole');
    if (role === 'admin') {
      return true;
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Acceso denegado',
        text: 'Solo los usuarios con el rol de "admin" pueden acceder a esta página.',
      }).then(() => {
        router.navigateByUrl('/home'); 
      });
      return false;
    }
  }
};