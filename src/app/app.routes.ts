import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { pacienteAdminGuard } from './guards/paciente-admin.guard';



export const routes: Routes = [
    {
        path: 'bienvenido',
        loadComponent: () => import('./bienvenido/bienvenido.component').then(m => m.BienvenidoComponent),
        data: { animation: 'bienvenidoPage' }
    },
    {
        path: 'home',
        loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
        data: { animation: 'homePage' }
    },
    { path:'registrarse', 
      loadComponent: () => import('./registro/registro.component').then(m => m.RegistroComponent)
    },
    {
        path:'',
        redirectTo: '/bienvenido',
        pathMatch: 'full',
    },
    {
        path: 'login',
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
        data: { animation: 'loginPage' } 
    },
    {
        path: 'home/seccion-usuarios',
        loadComponent: () => import('./home/seccion-usuarios/seccion-usuarios.component').then(m => m.SeccionUsuariosComponent),
        canActivate: [adminGuard]
    },
    {
        path: 'home/seccion-pacientes',
        loadComponent: () => import('./home/seccion-pacientes/seccion-pacientes.component').then(m => m.SeccionPacientesComponent),
       
    },
    {
        path: 'home/mis-turnos',
        loadComponent: () => import('./home/mis-turnos/mis-turnos.component').then(m => m.MisTurnosComponent),
        data: { animation: 'misTurnosPage' }
    },
    {
        path: 'home/turnos',
        loadComponent: () => import('./home/turnos/turnos.component').then(m => m.TurnosComponent),
        canActivate: [adminGuard],
        data: { animation: 'turnosPage' }
    },
    {
        path: 'home/solicitar-turno',
        loadComponent: () => import('./home/solicitar-turno/solicitar-turno.component').then(m => m.SolicitarTurnoComponent),
        canActivate: [pacienteAdminGuard]
    },
    {
        path: 'disponibilidad-horaria',
        loadComponent: () => import('./disponibilidad/disponibilidad.component').then(m => m.DisponibilidadComponent),
        data: { animation: 'disponibilidadPage' }
    }

];
