import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Auth, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';


interface SideNavToggle {
  screenWidth: number;
  collapsed: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  showLoading: boolean = true;

  @Output() onToggleSideNav: EventEmitter<SideNavToggle> = new EventEmitter();
  collapsed = false;
  screenWidth = 0;
  currentUser$: Observable<User | null>;
  isDropdownOpen = false;
  showLogoutButton = false;
  user: User | null = null;
  imagenPerfil: string | null = null;
  rolUsuario: string | null = null;




  constructor(private router: Router, private authService: AuthService, private auth: Auth) {
    this.currentUser$ = this.authService.getCurrentUser();
  }



  ngOnInit(): void {

    setTimeout(() => {
      //this.showLoading = false;
    }, 2000);

    this.screenWidth = window.innerWidth;
    this.currentUser$ = this.authService.getCurrentUser();
    this.authService.userRole$.subscribe(role => {
      this.rolUsuario = role;
    });
  }


  userLogged() {
    this.authService.getCurrentUser().subscribe(
      (user) => {
        console.log(user?.email);
      },
      (error) => {
        console.error('Error al obtener el usuario actual:', error);
      }
    );
  }

  seccionUsuarios()
  {
    this.router.navigate(['home/seccion-usuarios']);
  }


  seccionPacientes()
  {
    this.router.navigate(['home/seccion-pacientes']);
  }



  async logout() {
    Swal.fire({
      title: '¿Desea salir?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Aceptar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await this.auth.signOut();
          this.router.navigate(['/login']);
        } catch (error) {
          console.error('Error al cerrar sesión:', error);
        }
      } else {
        this.router.navigate(['/home']);
      }
    });
  }

  
  turnos()
  {
    this.router.navigate(['home/turnos']);
  }


  toggleCollapse(): void{
    this.collapsed = !this.collapsed;
    this.onToggleSideNav.emit({collapsed: this.collapsed, screenWidth: this.screenWidth});
  }
  
  closeSidenav(): void{
    this.collapsed = false;
    this.onToggleSideNav.emit({collapsed: this.collapsed, screenWidth: this.screenWidth});
  }
  
  handleNavigation(routeLink: string) {
  
    if (routeLink === 'logout') {
      this.logout();
    }
  }
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    this.showLogoutButton = this.isDropdownOpen; 
  }

  misTurnos()
  {
    this.router.navigate(['home/mis-turnos']);
  }

  solicitarTurno()
  {
    this.router.navigate(['home/solicitar-turno']);
  }

  disponibilidadHoraria()
  {
    this.router.navigate(['disponibilidad-horaria']);
  }

  informes()
  {
    this.router.navigate(['home/informes']);
  }

}
