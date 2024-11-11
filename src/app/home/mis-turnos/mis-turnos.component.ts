import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { Auth,User } from '@angular/fire/auth';
//import { HistoriaClinica, Turno, TurnosService
import { TurnosService, Turno } from '../../services/turnos.service';
import { CommonModule } from '@angular/common';
import { FilterEspPipe } from "../../pipes/filter-esp.pipe";
//import { LoadingComponent } from "../../loading/loading.component";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FilterPacPipe } from '../../pipes/filter-pac.pipe';
//import { FilterPipe } from "../../pipes/filter.pipe";
import { Timestamp  } from '@angular/fire/firestore';
//import { HistoriaClinicaService } from '../../services/historia-clinica.service';

@Component({
    selector: 'app-mis-turnos',
    standalone: true,
    templateUrl: './mis-turnos.component.html',
    styleUrl: './mis-turnos.component.css',  /*  FilterEspPipe, LoadingComponent  FilterPipe */
    imports: [CommonModule, ReactiveFormsModule, FormsModule, FilterEspPipe, FilterPacPipe]
})
export class MisTurnosComponent implements OnInit{

  filtro: string = '';
  turnos$: Observable<Turno[]> = of([]);
  userRole: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private turnosService: TurnosService,
    private auth:Auth
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().pipe(
      switchMap(user => {
        const userEmail = user?.email || ''; // Aseguramos que userEmail sea siempre una string
        if (userEmail) {
          return this.authService.getUserRole().pipe(
            switchMap(role => {
              this.userRole = role || ''; // Asignamos una cadena vacía si role es null
              return this.turnosService.obtenerTurnosPorUsuario(userEmail, this.userRole);
            })
          );
        } else {
          return of([]); // Retornamos un Observable vacío si userEmail es null o vacío
        }
      })
    ).subscribe(turnos => {
      this.turnos$ = of(turnos);
    });
  }

  aceptarTurno(turno: Turno) {
    if (turno.estado !== 'pendiente') return;

    this.turnosService.aceptarTurno(turno.id).then(() => {
      turno.estado = 'aceptado';
      Swal.fire('Turno Aceptado', 'El turno ha sido aceptado correctamente.', 'success');
    });
  }



  finalizarTurno(turno: Turno) {
    Swal.fire({
      title: 'Finalizar Turno',
      input: 'textarea',
      inputPlaceholder: 'Escriba un comentario o diagnóstico...',
      showCancelButton: true,
      confirmButtonText: 'Finalizar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const comentario = result.value;
        this.turnosService.finalizarTurno(turno.id, comentario).then(() => {
          turno.estado = 'realizado';
          turno.comentario = comentario;
          Swal.fire('Turno Finalizado', 'El turno ha sido finalizado correctamente.', 'success');
        });
      }
    });
  }

  rechazarTurno(turno: Turno) {
    Swal.fire({
      title: 'Rechazar Turno',
      input: 'text',
      inputPlaceholder: 'Ingrese el motivo del rechazo...',
      showCancelButton: true,
      confirmButtonText: 'Rechazar Turno',
      cancelButtonText: 'Cerrar',
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const motivo = result.value;
        this.turnosService.rechazarTurno(turno.id, motivo).then(() => {
          turno.estado = 'rechazado';
          turno.motivoRechazo = motivo;
          Swal.fire('Turno Rechazado', 'El turno ha sido rechazado.', 'success');
        });
      }
    });
  }

  cancelarTurno(turno: Turno): void {
    Swal.fire({
      title: 'Cancelar Turno',
      text: 'Ingrese el motivo de la cancelación:',
      input: 'text',
      showCancelButton: true,
      confirmButtonText: 'Cancelar Turno',
      cancelButtonText: 'Volver',
      inputValidator: (value) => {
        if (!value) {
          return 'Debe ingresar un motivo';
        }
        return null;
      }
    }).then(result => {
      if (result.isConfirmed) {
        this.turnosService.cancelarTurno(turno.id, result.value).then(() => {
          turno.estado = 'cancelado';
          Swal.fire('Turno Cancelado', 'El turno ha sido cancelado exitosamente.', 'success');
        });
      }
    });
  }
  
  verResena(turno: Turno): void {
    Swal.fire('Reseña', turno.comentario || 'No hay comentarios para este turno', 'info');
  }

  completarEncuesta(turno: Turno): void {
    Swal.fire({
      title: 'Completar Encuesta',
      html: `
        <label for="calificacionAtencion">Calificación de Atención (1-10):</label>
        <input type="number" id="calificacionAtencion" class="swal2-input" min="1" max="10" step="1">
        
        <label for="tiempoEspera">Tiempo de Espera (en minutos):</label>
        <input type="number" id="tiempoEspera" class="swal2-input" step="1">
        
        <label for="satisfaccionGeneral">Satisfacción General (1-10):</label>
        <input type="number" id="satisfaccionGeneral" class="swal2-input" min="1" max="10" step="1">
      `,
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      preConfirm: () => {
        const calificacionAtencion = (document.getElementById('calificacionAtencion') as HTMLInputElement).value;
        const tiempoEspera = (document.getElementById('tiempoEspera') as HTMLInputElement).value;
        const satisfaccionGeneral = (document.getElementById('satisfaccionGeneral') as HTMLInputElement).value;
  
        if (!calificacionAtencion || !tiempoEspera || !satisfaccionGeneral) {
          Swal.showValidationMessage('Por favor, complete todos los campos.');
          return null;
        }
  
        const calificacion = {
          calificacionAtencion: parseInt(calificacionAtencion),
          tiempoEspera: parseInt(tiempoEspera),  // No hay restricción de rango para minutos
          satisfaccionGeneral: parseInt(satisfaccionGeneral)
        };
  
        if (calificacion.calificacionAtencion < 1 || calificacion.calificacionAtencion > 10 ||
            calificacion.satisfaccionGeneral < 1 || calificacion.satisfaccionGeneral > 10) {
          Swal.showValidationMessage('Calificación y satisfacción deben estar entre 1 y 10.');
          return null;
        }
  
        return calificacion;
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.turnosService.completarEncuesta(turno.id, result.value).then(() => {
          turno.encuestaCompletada = true;
          Swal.fire('Encuesta Completada', 'Gracias por completar la encuesta.', 'success');
        });
      }
    });
  }

  calificarAtencion(turno: Turno): void {
    Swal.fire({
      title: 'Calificar Atención',
      input: 'textarea',
      showCancelButton: true,
      confirmButtonText: 'Enviar'
    }).then(result => {
      if (result.isConfirmed) {
        this.turnosService.calificarAtencion(turno.id, result.value).then(() => {
          turno.calificacionCompletada = true;
          Swal.fire('Calificación Enviada', 'Gracias por su calificación.', 'success');
        });
      }
    });
  }

  verEncuesta(turno: Turno): void {
    console.log("Turno seleccionado:", turno); // Verifica si el objeto turno tiene encuesta
  
    if (turno.encuesta) {
      const { calificacionAtencion, tiempoEspera, satisfaccionGeneral } = turno.encuesta;
      Swal.fire({
        title: 'Encuesta',
        html: `
          <p><strong>Calificación de Atención:</strong> ${calificacionAtencion} / 10</p>
          <p><strong>Tiempo de Espera:</strong> ${tiempoEspera} minutos</p>
          <p><strong>Satisfacción General:</strong> ${satisfaccionGeneral} / 10</p>
        `,
        icon: 'info',
        confirmButtonText: 'Cerrar'
      });
    } else {
      console.log("No se encontró encuesta en el turno:", turno);
      Swal.fire('Encuesta', 'No hay encuesta disponible para este turno.', 'info');
    }
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

  public goTo(path:string): void 
  {
    this.router.navigate([path]);
  }


}
  