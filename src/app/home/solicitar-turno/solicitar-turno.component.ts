import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { TurnosService } from '../../services/turnos.service';
import { EspecialistaService } from '../../services/especialista.service';
import { AuthService } from '../../services/auth.service';
import { PacienteService } from '../../services/paciente.service';
import { Observable } from 'rxjs';
import { Auth,User } from '@angular/fire/auth';
import { FormatoHoraPipe } from "../../pipes/formato-hora.pipe";
import { FormatoFechaPipe } from '../../pipes/formato-fecha.pipe';
import { FechaCustomizadaPipe } from '../../pipes/fecha-customizada.pipe';
import { Firestore, collection, doc, setDoc, collectionData } from '@angular/fire/firestore';





@Component({
    selector: 'app-solicitar-turno',
    standalone: true,
    templateUrl: './solicitar-turno.component.html',
    styleUrl: './solicitar-turno.component.css',
    imports: [FechaCustomizadaPipe, CommonModule, FormsModule, ReactiveFormsModule,FormatoHoraPipe, FormatoFechaPipe /*LoadingComponent, , FormatoHoraPipe, SinImagenDirective,ResaltarDirective,FocusDirective*/]
})
export class SolicitarTurnoComponent implements OnInit{


  especialidadImagenMap: { [key: string]: string } = {};
  especialidades: string[] = [];
  especialistas: any[] = [];
  //horariosDisponibles: string[] = [];
  especialidadSeleccionada: string | null = null;
  especialistaSeleccionado: any | null = null;
  diaSeleccionado: string | null = null;
  horarioSeleccionado: string | null = null;
  pacienteSeleccionado: any | null = null;
  currentUser$: Observable<User | null>;

  horariosDisponibles: { horario: string; ocupado: boolean }[] = [];

  diasDisponibles: { fechaSeleccionada: Date; especialidad: string }[] = [];

  esAdmin: boolean = false;
  pacientes: any[] = []; // Lista de pacientes para el rol administrador
  pacienteSeleccionadoUID: string = '';




  constructor(
    private especialistaService: EspecialistaService,
    private turnosService: TurnosService,
    private authService: AuthService,
    private router: Router,
    private auth: Auth,
    private firestore: Firestore,
    private pacientesService: PacienteService
  ) {
    this.currentUser$ = this.authService.getCurrentUser();
  }

 /* ngOnInit(): void {
    this.cargarEspecialidades();
    this.currentUser$.subscribe(user => {
      if (!user) this.router.navigate(['/login']);
    });

  }*/

    ngOnInit(): void {
      // Cargar las especialidades al iniciar
      this.cargarEspecialidades();
      
      // Verificar el usuario actual
      this.currentUser$.subscribe(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return;
        }
        
        // Obtener el rol del usuario actual y verificar si es administrador
        this.authService.getCurrentUserRole().subscribe(role => {
          this.esAdmin = role === 'admin'; // Verificar si el usuario es administrador
    
          if (this.esAdmin) {
            // Si es administrador, cargar la lista de pacientes
            this.cargarPacientes();
          }
        });
      });
    }

    cargarPacientes(): void {
      this.pacientesService.obtenerPacientes().subscribe(pacientes => {
        this.pacientes = pacientes;
        console.log("Lista de pacientes:", this.pacientes);
      });
    }


  convertirADate(fechaSeleccionada: string): Date | null {
    const fecha = new Date(fechaSeleccionada);
    return isNaN(fecha.getTime()) ? null : fecha; 
  }
  


    cargarEspecialidades(): void {
      const especialidadesRef = collection(this.firestore, 'Especialidades');
      collectionData(especialidadesRef).subscribe(
        (especialidades: any[]) => {
          this.especialidades = especialidades.map(e => e.nombre);
          this.especialidadImagenMap = especialidades.reduce((acc, e) => {
           
            const nombreFormateado = e.nombre.toLowerCase().replace(/\s+/g, '');
            
            acc[e.nombre] = e.imagen || `assets/${nombreFormateado}.jpg`;
           
            return acc;
          }, {} as { [key: string]: string });
        },
        error => console.error('Error al cargar especialidades:', error)
      );
    }

  seleccionarEspecialidad(especialidad: string): void {
    this.especialidadSeleccionada = especialidad;
    this.especialistaService.obtenerEspecialistasPorEspecialidad(especialidad).subscribe(
      (especialistas) => {
        this.especialistas = especialistas;
        this.diasDisponibles = [];
        this.horariosDisponibles = [];
        this.especialistaSeleccionado = null;
        this.diaSeleccionado = null;
        this.horarioSeleccionado = null;
      },
      error => console.error('Error al obtener especialistas:', error)
    );
  }

      seleccionarEspecialista(especialista: any): void {
        this.especialistaSeleccionado = especialista;
      
        if (this.especialidadSeleccionada) {
          this.turnosService.obtenerDiasDisponiblesPorEspecialista(especialista.id, this.especialidadSeleccionada).subscribe(
            (dias) => {
        
              this.diasDisponibles = dias.filter(dia => dia.horarios.some(horario => !horario.ocupado));
              this.horariosDisponibles = [];
              this.diaSeleccionado = null;
              this.horarioSeleccionado = null;
            },
            error => console.error('Error al obtener días disponibles:', error)
          );
        } else {
          console.error('No se ha seleccionado una especialidad válida');
        }
      }
 

          seleccionarDia(dia: Date | null): void {
            if (dia && this.especialistaSeleccionado && this.especialidadSeleccionada) {
                this.diaSeleccionado = dia.toISOString();
                
                this.turnosService.obtenerHorariosDisponiblesConEstado(
                    this.especialistaSeleccionado.id,
                    dia,
                    this.especialidadSeleccionada
                ).subscribe(
                    horarios => {
                        this.horariosDisponibles = horarios;
                        this.horarioSeleccionado = null;
                        console.log('Horarios con estado:', this.horariosDisponibles); // Debug
                    },
                    error => console.error('Error al obtener horarios con estado:', error)
                );
            } else {
                console.error('Día o especialista/ especialidad seleccionados no válidos');
            }
        }
 


  
  seleccionarHorario(horario: string): void {
    this.horarioSeleccionado = horario;
  }


      confirmarTurno(): void {
        if (!this.especialidadSeleccionada || !this.especialistaSeleccionado || !this.diaSeleccionado || !this.horarioSeleccionado) {
            console.log('Error: Por favor, complete todos los campos para confirmar el turno');
            Swal.fire('Error', 'Por favor, complete todos los campos para confirmar el turno', 'error');
            return;
        }
    
        this.authService.getCurrentUserRole().subscribe(role => {
            const esAdmin = role === 'admin';
            
            console.log("ID del paciente seleccionado:", this.pacienteSeleccionadoUID);
           
            const obtenerInfoPaciente = esAdmin
                ? this.authService.obtenerPacienteInfo(this.pacienteSeleccionadoUID)
                : this.authService.obtenerInfoUsuarioActual1();
    
            obtenerInfoPaciente.then(pacienteInfo => {
                if (!pacienteInfo || !pacienteInfo.nombre || !pacienteInfo.apellido || !pacienteInfo.mail) {
                    console.log('No se pudo obtener la información completa del paciente');
                    Swal.fire('Error', 'Por favor, seleccione un paciente válido', 'error');
                    return;
                }
    
                console.log("PACIENTE ACTUAL:", pacienteInfo.apellido);
    
                const especialistaId = this.especialistaSeleccionado.id;
                this.especialistaService.getEspecialistaInfo(especialistaId).subscribe(
                    especialistaData => {
                        if (!especialistaData) {
                            console.log('No se pudo obtener la información del especialista');
                            Swal.fire('Error', 'Hubo un problema al obtener la información del especialista', 'error');
                            return;
                        }
    
                        console.log("ESPECIALISTA ACTUAL:", especialistaData.apellido);
    
                        const turnoData = {
                            especialidad: this.especialidadSeleccionada,
                            especialistaId: especialistaId,
                            fechaSeleccionada: this.diaSeleccionado,
                            horario: this.horarioSeleccionado,
                            paciente: {
                                nombre: pacienteInfo.nombre,
                                apellido: pacienteInfo.apellido,
                                mail: pacienteInfo.mail,
                            },
                            especialista: {
                                nombre: especialistaData.nombre,
                                apellido: especialistaData.apellido,
                                mail: especialistaData.mail
                            }
                        };
    
                        this.guardarTurno(turnoData);
                    },
                    error => {
                        console.error('Error al obtener información del especialista:', error);
                        Swal.fire('Error', 'Hubo un problema al obtener la información del especialista', 'error');
                    }
                );
            }).catch(error => {
                console.error('Error al obtener la información del paciente:', error);
                Swal.fire('Error', 'Hubo un problema al obtener la información del paciente', 'error');
            });
        });
    }

  // Método auxiliar para guardar el turno en la base de datos
  private guardarTurno(turnoData: any): void {

    const turnoCompleto = {
      ...turnoData,
      fechaHora: new Date(`${turnoData.fechaSeleccionada} ${turnoData.horario}`), // Usa la fecha completa con hora configurada
      estado: 'pendiente',
      ocupado: false,
      especialista: {
          nombre: turnoData.especialista.nombre || '',
          apellido: turnoData.especialista.apellido || '',
          mail: turnoData.especialista.mail || ''
      },
      paciente: {
          nombre: turnoData.paciente.nombre || '',
          apellido: turnoData.paciente.apellido || '',
          mail: turnoData.paciente.mail || ''
      }
  };

    console.log("Datos completos a guardar:", turnoCompleto);

    this.turnosService.solicitarTurno(turnoCompleto).then(() => {
        Swal.fire('Turno solicitado', 'Su turno ha sido reservado exitosamente', 'success');
        this.resetFormulario();
    }).catch(error => {
        console.error('Error al solicitar el turno:', error);
        Swal.fire('Error', 'Hubo un problema al solicitar el turno, intente nuevamente', 'error');
    });
}

  // Restablecer formulario
  public resetFormulario(): void {
    this.especialidadSeleccionada = null;
    this.especialistaSeleccionado = null;
    this.diaSeleccionado = null;
    this.horarioSeleccionado = null;
    this.diasDisponibles = [];
    this.horariosDisponibles = [];
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
  
  volver(): void {
    if (this.horarioSeleccionado) {
      this.horarioSeleccionado = null;
    } else if (this.diaSeleccionado) {
      this.diaSeleccionado = null;
    } else if (this.especialistaSeleccionado) {
      this.especialistaSeleccionado = null;
    } else if (this.especialidadSeleccionada) {
      this.especialidadSeleccionada = null;
    }
  }
  
  puedeVolver(): boolean {
    return !!(this.horarioSeleccionado || this.diaSeleccionado || this.especialistaSeleccionado || this.especialidadSeleccionada);
  }

}


 