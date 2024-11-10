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
//import { FilterPipe } from "../../pipes/filter.pipe";
import { Timestamp  } from '@angular/fire/firestore';
//import { HistoriaClinicaService } from '../../services/historia-clinica.service';

@Component({
    selector: 'app-mis-turnos',
    standalone: true,
    templateUrl: './mis-turnos.component.html',
    styleUrl: './mis-turnos.component.css',  /*  FilterEspPipe, LoadingComponent  FilterPipe */
    imports: [CommonModule, ReactiveFormsModule, FormsModule, FilterEspPipe]
})
export class MisTurnosComponent implements OnInit{

  btnVolver = 'Volver a home';
  showLoading: boolean = true;
  filtro: string = '';

 //@Output() onToggleSideNav: EventEmitter<SideNavToggle> = new EventEmitter();

  collapsed = false;
  screenWidth = 0;
  currentUser$: Observable<User | null>;
  isDropdownOpen = false;
  showLogoutButton = false;
  pacienteMail = '';
  pacienteNombre = '';
  pacienteApellido = '';
  especialistasMail = '';
  especialistasNombre = '';
  especialistasApellido = '';
  turnos: Turno[] = [];
  turno: Turno [] = [];
  turnosFiltrados: Turno[] = [];
  turnosPaciente: Turno[] = [];
  turnosEspecialista: Turno[] = [];
  turnosFiltradosPaciente: Turno[] = [];
  turnosFiltradosEspecialista: Turno[] = [];
  filtroPaciente: string = '';
  filtroEspecialista: string = '';
  especialidades: string[] = [];
  especialistas: string[] = [];
  fechaSeleccionada: Date = new Date();
  horaInicio: string = '';
  horaFin: string = '';
  selectedYear: number;
  selectedMonth: number;
  selectedDay: number;
  especialidadesPrecargadas: string[] = ['Ginecología', 'Cardiología', 'Kinesiología', 'Nutricionista'];
  isPaciente: boolean = false;
  isEspecialista: boolean = false;
  tieneTurnoCancelado: boolean = false;
  tieneTurnoRechazado: boolean = false;
  userRole: string | null = null;
  animate = false;
  usuarioLogueado: string = '';
  searchText: string = '';

  turnos$: Observable<any[]> = new Observable<any[]>();;
  
  constructor (private router: Router, private authService: AuthService, private turnosService: TurnosService, private auth: Auth /*, private historiaClinicaService: HistoriaClinicaService*/) {
    this.currentUser$ = this.authService.getCurrentUser();
    this.selectedYear = 0; 
    this.selectedMonth = 0;
    this.selectedDay = 0;

        
  }

  ngOnInit(): void {
    console.log('ngOnInit called');

    this.currentUser$.pipe(
      switchMap(user => {
        if (user) {
          const userEmail = user.email!;
          return this.authService.getUserRole().pipe(
            switchMap(userRole => {
              this.userRole = userRole;
              if (userRole) {
                console.log(`UserRole: ${userRole}`);
                return this.turnosService.obtenerTurnosPorUsuario(userEmail, userRole);
              } else {
                return of([]);
              }
            }),
            catchError(error => {
              console.error('Error fetching user role or turnos:', error);
              return of([]);
            })
          );
        } else {
          return of([]);
        }
      })
    ).subscribe(turnos => {
      this.turnos = turnos;
      this.turnos$ = of(turnos);
      this.showLoading = false;
      this.actualizarCondiciones();
      console.log('Turnos fetched:', turnos);
    });
  }


  public onClickHome(event: any): void 
  {
    this.animate = true;
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 600); // Tie
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    this.showLogoutButton = this.isDropdownOpen; 
  }

  private actualizarCondiciones(): void {
    this.tieneTurnoCancelado = this.turnos.some(turno => turno.motivoCancelacion !== undefined);
    this.tieneTurnoRechazado = this.turnos.some(turno => turno.motivoRechazo !== undefined);

    if (this.tieneTurnoCancelado) {
      console.log('Hay al menos un turno cancelado.');
    }

    if (this.tieneTurnoRechazado) {
      console.log('Hay al menos un turno rechazado.');
    }
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


  async obtenerTurnosPaciente(pacienteMail: string): Promise<void> {
    try {
      console.log('Obteniendo turnos para el usuario:', pacienteMail);
      this.turnosService.obtenerTurnosPorPaciente(pacienteMail).subscribe(
        (turnos) => {
          console.log('Turnos del paciente:', turnos);
          this.turnosPaciente  = turnos;
          this.turnosFiltradosPaciente = this.turnosPaciente;
          this.tieneTurnoCancelado = this.turnosPaciente.some(turno => turno.estado === 'cancelado');
          this.showLoading = false;
        },
        (error) => {
          console.error('Error al obtener los turnos del paciente:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error al obtener los turnos',
            text: 'Hubo un problema al obtener los turnos del paciente. Por favor, inténtalo nuevamente.'
          });
          this.showLoading = false;
        }
      );
    } catch (error) {
      console.error('Error al obtener los turnos del paciente:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al obtener los turnos',
        text: 'Hubo un problema al obtener los turnos del paciente. Por favor, inténtalo nuevamente.'
      });
      this.showLoading = false;
    }
  }


  aceptarTurno(turno: Turno) {
    if (turno.estado !== 'pendiente') {
      Swal.fire({
        icon: 'error',
        title: 'No Disponible',
        text: 'El turno no está en estado pendiente y no puede ser aceptado.',
        confirmButtonText: 'OK'
      });
      return;
    }

    Swal.fire({
      title: 'Aceptar Turno',
      text: '¿Está seguro de que desea aceptar este turno?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Verificando disponibilidad para turno con ID:', turno.id);
        const fechaHora = turno.fechaHora instanceof Timestamp ? turno.fechaHora.toDate() : turno.fechaHora;

        const horaInicio = turno.horaInicio || '';
        const horaFin = turno.horaFin || '';

        this.turnosService.verificarDisponibilidad(turno.especialistaId, fechaHora, horaInicio, horaFin).subscribe(disponible => {
          if (disponible) {
            console.log('Turno disponible, aceptando turno con ID:', turno.id);
            this.turnosService.aceptarTurno(turno.id).then(() => {
              Swal.fire({
                icon: 'success',
                title: 'Turno Aceptado',
                text: 'El turno ha sido aceptado correctamente.',
                confirmButtonText: 'OK'
              });

              // Actualizar el estado del turno en la lista local
              this.turnos = this.turnos.map(t => t.id === turno.id ? { ...t, estado: 'aceptado', ocupado: true } : t);
              this.turnos$ = of(this.turnos);
            }).catch((error: any) => {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema al aceptar el turno. Por favor, inténtalo nuevamente.',
                confirmButtonText: 'OK'
              });
              console.error('Error al aceptar el turno:', error);
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'No Disponible',
              text: 'El turno ya está ocupado. Por favor, elija otro horario.',
              confirmButtonText: 'OK'
            });
            console.log('Turno no disponible:', turno);
          }
        });
      }
    });
  }



  cancelarTurno(turno: Turno) {
    Swal.fire({
      title: 'Cancelar Turno',
      text: 'Ingrese el motivo de la cancelación:',
      input: 'text',
      inputAttributes: {
        'aria-label': 'Ingrese el motivo de la cancelación'
      },
      showCancelButton: true,
      confirmButtonText: 'Cancelar Turno',
      cancelButtonText: 'Cerrar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes ingresar un motivo para cancelar el turno';
        } else {
          return null;
        }
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const motivo = result.value;
        this.turnosService.cancelarTurno(turno.id, motivo).then(() => {
          Swal.fire({
            icon: 'success',
            title: 'Turno Cancelado',
            text: 'El turno ha sido cancelado correctamente.',
            confirmButtonText: 'OK'
          });

          // Actualizar el estado del turno en la lista local
          this.turnos = this.turnos.map(t => t.id === turno.id ? { ...t, estado: 'cancelado', motivoCancelacion: motivo } : t);
          this.actualizarCondiciones();
          //this.turnos$ = of(this.turnos);
        }).catch((error: any) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al cancelar el turno. Por favor, inténtalo nuevamente.',
            confirmButtonText: 'OK'
          });
          console.error('Error al cancelar el turno:', error);
        });
      }
    });
  }

  rechazarTurno(turno: Turno) {
    Swal.fire({
      title: 'Rechazar Turno',
      text: 'Ingrese el motivo de la cancelación:',
      input: 'text',
      inputAttributes: {
        'aria-label': 'Ingrese el motivo de la cancelación'
      },
      showCancelButton: true,
      confirmButtonText: 'Rechazar Turno',
      cancelButtonText: 'Cerrar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes ingresar un motivo para rechazar el turno';
        } else {
          return null;
        }
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const motivo = result.value;
        this.turnosService.rechazarTurno(turno.id, motivo).then(() => {
          Swal.fire({
            icon: 'success',
            title: 'Turno rechazado',
            text: 'El turno ha sido rechazado correctamente.',
            confirmButtonText: 'OK'
          });

          this.turnos = this.turnos.map(t => t.id === turno.id ? { ...t, estado: 'rechazado', motivoRechazo: motivo } : t);
          this.tieneTurnoRechazado = this.turnos.some(t => t.motivoRechazo !== undefined);
          this.turnos$ = of(this.turnos);
        }).catch((error: any) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al rechazado el turno. Por favor, inténtalo nuevamente.',
            confirmButtonText: 'OK'
          });
          console.error('Error al rechazado el turno:', error);
        });
      }
    });
  }

  finalizarTurno(turno: Turno) {
    Swal.fire({
      title: 'Finalizar Turno',
      text: 'Ingrese un comentario o reseña de la consulta:',
      input: 'textarea',
      inputAttributes: {
        'aria-label': 'Ingrese un comentario o reseña'
      },
      showCancelButton: true,
      confirmButtonText: 'Finalizar Turno',
      cancelButtonText: 'Cerrar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes ingresar un comentario para finalizar el turno';
        } else {
          return null;
        }
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const comentario = result.value;
        this.turnosService.finalizarTurno(turno.id, comentario).then(() => {
          Swal.fire({
            icon: 'success',
            title: 'Turno Finalizado',
            text: 'El turno ha sido finalizado correctamente.',
            confirmButtonText: 'OK'
          });

          this.turnos = this.turnos.map(t => t.id === turno.id ? { ...t, estado: 'realizado', comentario } : t);
          this.turnos$ = of(this.turnos);
        }).catch((error: any) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al finalizar el turno. Por favor, inténtalo nuevamente.',
            confirmButtonText: 'OK'
          });
          console.error('Error al finalizar el turno:', error);
        });
      }
    });
  }

  cargarHistoriaClinica(turno: Turno) {
    const turnoId = turno.id;
    const pacienteEmail = turno.paciente.mail;
    const fechaTurno = turno.fechaHora;
    turno.historiaClinicaCargada = true;
  
    this.authService.getUserByEmail(pacienteEmail).subscribe(paciente => {
      if (paciente && paciente.id) {
        const pacienteId = paciente.id;
        this.router.navigate(['/historia-clinica', { turnoId: turnoId, pacienteId: pacienteId, fechaTurno: fechaTurno  }]);

      } else {
        console.error('No se pudo encontrar la información del paciente.');
      }
    });
  }

verResena(turno: Turno): void {
  this.turnosService.obtenerResena(turno.id).subscribe(
    (comentario) => {
      if (comentario) {
        Swal.fire({
          title: 'Reseña del Turno',
          text: comentario,
          icon: 'info',
          confirmButtonText: 'Cerrar'
        });
      } else {
        Swal.fire({
          title: 'No hay reseña',
          text: 'Este turno no tiene una reseña cargada.',
          icon: 'warning',
          confirmButtonText: 'Cerrar'
        });
      }
    },
    (error) => {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo obtener la reseña del turno.',
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
    }
  );
}


completarEncuesta(turno: Turno): void {
  Swal.fire({
    title: 'Completar encuesta de satisfacción',
    html: `
      <style>
        .star-rating {
          display: flex;
          flex-direction: row-reverse;
          justify-content: center;
        }
        .star-rating input {
          display: none;
        }
        .star-rating label {
          font-size: 2rem;
          color: #ddd;
          cursor: pointer;
        }
        .star-rating input:checked ~ label {
          color: #f2b600;
        }
        .star-rating input:hover ~ label {
          color: #f2b600;
        }
      </style>
      <div>
        <label>Atención recibida:</label>
        <div class="star-rating">
          <input type="radio" id="star5" name="calificacionAtencion" value="5" /><label for="star5" title="5 estrellas">★</label>
          <input type="radio" id="star4" name="calificacionAtencion" value="4" /><label for="star4" title="4 estrellas">★</label>
          <input type="radio" id="star3" name="calificacionAtencion" value="3" /><label for="star3" title="3 estrellas">★</label>
          <input type="radio" id="star2" name="calificacionAtencion" value="2" /><label for="star2" title="2 estrellas">★</label>
          <input type="radio" id="star1" name="calificacionAtencion" value="1" /><label for="star1" title="1 estrella">★</label>
        </div>
      </div>
      <div>
        <label>Tiempo de espera:</label>
        <div class="star-rating">
          <input type="radio" id="star10" name="tiempoEspera" value="5" /><label for="star10" title="5 estrellas">★</label>
          <input type="radio" id="star9" name="tiempoEspera" value="4" /><label for="star9" title="4 estrellas">★</label>
          <input type="radio" id="star8" name="tiempoEspera" value="3" /><label for="star8" title="3 estrellas">★</label>
          <input type="radio" id="star7" name="tiempoEspera" value="2" /><label for="star7" title="2 estrellas">★</label>
          <input type="radio" id="star6" name="tiempoEspera" value="1" /><label for="star6" title="1 estrella">★</label>
        </div>
      </div>
      <div>
        <label>Satisfacción general:</label>
        <div class="star-rating">
          <input type="radio" id="star15" name="satisfaccionGeneral" value="5" /><label for="star15" title="5 estrellas">★</label>
          <input type="radio" id="star14" name="satisfaccionGeneral" value="4" /><label for="star14" title="4 estrellas">★</label>
          <input type="radio" id="star13" name="satisfaccionGeneral" value="3" /><label for="star13" title="3 estrellas">★</label>
          <input type="radio" id="star12" name="satisfaccionGeneral" value="2" /><label for="star12" title="2 estrellas">★</label>
          <input type="radio" id="star11" name="satisfaccionGeneral" value="1" /><label for="star11" title="1 estrella">★</label>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Enviar Encuesta',
    cancelButtonText: 'Cancelar',
    focusConfirm: false,
    preConfirm: () => {
      const calificacionAtencion = (document.querySelector('input[name="calificacionAtencion"]:checked') as HTMLInputElement)?.value;
      const tiempoEspera = (document.querySelector('input[name="tiempoEspera"]:checked') as HTMLInputElement)?.value;
      const satisfaccionGeneral = (document.querySelector('input[name="satisfaccionGeneral"]:checked') as HTMLInputElement)?.value;

      if (!calificacionAtencion || !tiempoEspera || !satisfaccionGeneral) {
        Swal.showValidationMessage('Debe completar todos los campos obligatorios');
        return null;
      }

      return {
        calificacionAtencion: parseInt(calificacionAtencion),
        tiempoEspera: parseInt(tiempoEspera),
        satisfaccionGeneral: parseInt(satisfaccionGeneral)
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const encuestaData = result.value;
      this.turnosService.completarEncuesta(turno.id, encuestaData)
        .then(() => {
          Swal.fire('Encuesta completada', 'La encuesta ha sido enviada correctamente.', 'success');
          turno.encuestaCompletada = true;
          turno.encuesta = encuestaData;
          this.obtenerTurnosPaciente(turno.paciente.mail); // Refrescar la lista de turnos
        })
        .catch((error) => {
          Swal.fire('Error', 'Hubo un problema al enviar la encuesta. Por favor, inténtalo nuevamente.', 'error');
        });
    }
  });
}

verEncuesta(turno: Turno): void {
  Swal.fire({
    title: 'Resultados de la Encuesta',
    html: `
      <div>
        <p><strong>Atención recibida:</strong> ${turno.encuesta?.calificacionAtencion} estrellas</p>
      </div>
      <div>
        <p><strong>Tiempo de espera:</strong> ${turno.encuesta?.tiempoEspera} estrellas</p>
      </div>
      <div>
        <p><strong>Satisfacción general:</strong> ${turno.encuesta?.satisfaccionGeneral} estrellas</p>
      </div>
    `,
    confirmButtonText: 'Cerrar'
  });
}

calificarAtencion(turno: Turno): void {
  Swal.fire({
    title: 'Comentario Atención',
    input: 'textarea',
    inputPlaceholder: 'Escriba su calificación aquí...',
    showCancelButton: true,
    confirmButtonText: 'Enviar Calificación',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return 'Debes ingresar una calificación';
      }
      return null;
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      this.turnosService.calificarAtencion(turno.id, result.value)
        .then(() => {
          turno.calificacionCompletada = true;
          Swal.fire('Calificación enviada', 'La calificación ha sido enviada correctamente.', 'success');
          this.obtenerTurnosPaciente(turno.paciente.mail); // Refrescar la lista de turnos
        })
        .catch((error) => {
          Swal.fire('Error', 'Hubo un problema al enviar la calificación. Por favor, inténtalo nuevamente.', 'error');
        });
    }
  });
}

verCalificacion(turno: Turno): void {
  this.turnosService.obtenerTurnoPorId(turno.id).subscribe(
    (turnoCompleto) => {
      if (turnoCompleto.comentarioCalificacion) {
        Swal.fire({
          title: 'Comentario de la Calificación',
          html: `
            <div>
              <strong><p>${turnoCompleto.comentarioCalificacion}</p></strong>
            </div>
          `,
          confirmButtonText: 'Cerrar'
        });
      } else {
        Swal.fire({
          title: 'No hay calificación',
          text: 'Este turno no tiene una calificación cargada.',
          icon: 'warning',
          confirmButtonText: 'Cerrar'
        });
      }
    },
    (error) => {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo obtener la calificación del turno.',
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
    }
  );
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

}