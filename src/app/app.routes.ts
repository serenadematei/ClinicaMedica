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
    },
    {
        path: 'home/informes',
        loadComponent: () => import('./home/informes/informes.component').then((m) => m.InformesComponent),
        canActivate: [adminGuard],
       // data: { animation: 'informesPage' },
    },
    {
        path: 'home/informes/log-ingresos',
        loadComponent: () =>
          import('./home/informes/log-ingresos/log-ingresos.component').then(
            (m) => m.LogIngresosComponent
          ),
    },
    {
        path: 'home/informes/turnos-especialidad',
        loadComponent: () =>
          import('./home/informes/turnos-por-especialidad/turnos-por-especialidad.component').then(
            (m) => m.TurnosPorEspecialidadComponent
          ),
    },
    {
        path: 'home/informes/turnos-dia',
        loadComponent: () =>
          import('./home/informes/turnos-por-dia/turnos-por-dia.component').then(
            (m) => m.TurnosPorDiaComponent
          ),
    },
    {
        path: 'home/informes/turnos-solicitados-medico',
        loadComponent: () =>
          import('./home/informes/turnos-solicitados-por-medico/turnos-solicitados-por-medico.component').then(
            (m) => m.TurnosSolicitadosPorMedicoComponent
          ),
    },
    {
      path: 'home/informes/turnosFinalizadosPorMedico',
      loadComponent: () =>
        import('./home/informes/turnos-finalizados-por-medico/turnos-finalizados-por-medico.component').then(
          (m) => m.TurnosFinalizadosPorMedicoComponent
        ),
    }
    //AGREGARLES ADMIN GUARD!!
   // { path: 'home/informes/log-ingresos', component: LogIngresosComponent },

];
