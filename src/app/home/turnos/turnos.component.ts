import { Component, OnInit } from '@angular/core';
//import { LoadingComponent } from "../../loading/loading.component";
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Turno, TurnosService } from '../../services/turnos.service';
import { Auth,User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { FilterPipe } from "../../pipes/filter.pipe";

@Component({
    selector: 'app-turnos',
    standalone: true,
    templateUrl: './turnos.component.html',
    styleUrl: './turnos.component.css',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, FilterPipe]
})
export class TurnosComponent implements OnInit{

  btnVolver = 'Volver a home';
  showLoading: boolean = true;
  filtro: string = '';
  selectedYear: number;
  selectedMonth: number;
  selectedDay: number;
  currentUser$: Observable<User | null>;
  isDropdownOpen = false;
  showLogoutButton = false;
  turnosFiltrados: Turno[] = [];
  especialidadesPrecargadas: string[] = ['Ginecología', 'Cardiología', 'Kinesiología', 'Nutricionista'];
  turnos: Turno[] = [];
  pacienteMail = '';
  pacienteNombre = '';
  pacienteApellido = '';
  especialistasMail = '';
  especialistasNombre = '';
  especialistasApellido = '';
  tieneTurnoCancelado: boolean = false;


  constructor (private router: Router, private authService: AuthService, private turnosService: TurnosService, private auth: Auth) {
    this.currentUser$ = this.authService.getCurrentUser();
    this.selectedYear = 0; 
    this.selectedMonth = 0;
    this.selectedDay = 0;

        
  }


  ngOnInit(): void {
    this.obtenerTodosLosTurnos();
  }

  public onClickHome(event: any): void 
  {
    this.router.navigate(['home']);
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    this.showLogoutButton = this.isDropdownOpen; 
  }

  async obtenerTodosLosTurnos(): Promise<void> {
    try {
      //console.log('Obteniendo todos los turnos');
      this.turnosService.obtenerTodosLosTurnos().subscribe(
        (turnos) => {
          //console.log('Todos los turnos:', turnos);
          this.turnos = turnos;
          this.turnosFiltrados = this.turnos;
          this.tieneTurnoCancelado = this.turnos.some(turno => turno.estado === 'cancelado');
          this.showLoading = false;
        },
        (error) => {
          console.error('Error al obtener todos los turnos:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error al obtener los turnos',
            text: 'Hubo un problema al obtener los turnos. Por favor, inténtalo nuevamente.'
          });
          this.showLoading = false;
        }
      );
    } catch (error) {
      console.error('Error al obtener los turnos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al obtener los turnos',
        text: 'Hubo un problema al obtener los turnos. Por favor, inténtalo nuevamente.'
      });
      this.showLoading = false;
    }
  }

  cancelarTurnoComoAdmin(turno: Turno): void {

    if (turno.estado !== 'pendiente') {
      Swal.fire('No se puede cancelar', 'Solo se pueden cancelar turnos en estado pendiente.', 'error');
      return;
    }

    Swal.fire({
      title: 'Cancelar Turno',
      input: 'text',
      inputLabel: 'Motivo de la cancelación',
      inputPlaceholder: 'Ingrese el motivo',
      showCancelButton: true,
      confirmButtonText: 'Cancelar Turno',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes ingresar un motivo para cancelar el turno';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.turnosService.cancelarTurnoComoAdmin(turno.id, result.value)
          .then(() => {
            Swal.fire('Cancelado', 'El turno ha sido cancelado.', 'success');
            this.obtenerTodosLosTurnos();
          })
          .catch((error) => {
            Swal.fire('Error', error, 'error');
          });
      }
    });
  }

  async logout() {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Lamentamos que quieras salir...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, salir'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          //console.log('Route link clicked: logout');
          await this.auth.signOut();
          this.router.navigate(['/login']);
        } catch (error) {
          console.error('Error al cerrar sesión:', error);
        }
      } else {

      }
    });
  }
}