import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';



export const routes: Routes = [
    {
        path: 'bienvenido',
        loadComponent: () => import('./bienvenido/bienvenido.component').then(m => m.BienvenidoComponent),
    },
    {
        path: 'home',
        loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
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
    },
    {
        path: 'home/seccion-usuarios',
        loadComponent: () => import('./home/seccion-usuarios/seccion-usuarios.component').then(m => m.SeccionUsuariosComponent),
        canActivate: [adminGuard]
    }

];
