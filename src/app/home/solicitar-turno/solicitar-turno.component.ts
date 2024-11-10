import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Paciente, Turno, TurnosService } from '../../services/turnos.service';
import { EspecialistaService } from '../../services/especialista.service';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { addDays, format, isValid, parse, startOfTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { PacienteService } from '../../services/paciente.service';
//import { LoadingComponent } from "../../loading/loading.component";
import { Observable } from 'rxjs';
import { Auth,User } from '@angular/fire/auth';
import { TurnoDisponible } from '../../services/turnos.service';
import { Timestamp } from '@angular/fire/firestore';
import { FormatoHoraPipe } from "../../pipes/formato-hora.pipe";
import { FormatoFechaPipe } from '../../pipes/formato-fecha.pipe';

/*
import { SinImagenDirective } from '../../validadores/sin-imagen.directive'
import { ResaltarDirective } from '../../validadores/resaltar.directive'
import { FocusDirective } from '../../validadores/focus.directive'*/


@Component({
    selector: 'app-solicitar-turno',
    standalone: true,
    templateUrl: './solicitar-turno.component.html',
    styleUrl: './solicitar-turno.component.css',
    imports: [CommonModule, FormsModule, ReactiveFormsModule,FormatoHoraPipe, FormatoFechaPipe /*LoadingComponent, , FormatoHoraPipe, SinImagenDirective,ResaltarDirective,FocusDirective*/]
})
export class SolicitarTurnoComponent implements OnInit{
 
  solicitarTurnoForm: FormGroup;
  currentUser$: Observable<User | null>;
  isDropdownOpen = false;
  showLogoutButton = false;
  especialidad: string = '';
  especialidades: string[] = []; 
  especialistas: { id: string, nombre: string, apellido: string, imagenPerfil: string }[] = [];
  availableDates: { value: string, label: string }[] = [];
  fechaSeleccionada: Date | null = null;
  selectedDay: Date = new Date();
  formSubmitted: boolean;
  btnVolver = 'Volver a home';
  horaInicio = '';
  horaFin = '';
  filtro: string = '';
  fechaSeleccionadaComoDate = new Date();
  especialidadesConImagenes: { [key: string]: string } = {};
  //imagenPorDefecto: string = 'assets/imagenesEspecialidades/noimage.png';
  imagenEspecialidadSeleccionada: string = '';
  seleccionado: string | null = null;
  especialistaSeleccionado: any | null = null;
  fechaString = '';
  especialidadSeleccionada: string | null = null;
  especialidadActual: string | null = null;
  especialistaSeleccionadoHorario: boolean = false;
  especialidadIndex: number | null = null;
  horariosDisponibles: string[] = [];
  horariosAceptados: { fecha: string, horaInicio: string, horaFin: string }[] = [];
  turnosDisponibles: TurnoDisponible[] = [];
  turnoSeleccionado: any; 
  showLoading: boolean = true;
  isAdmin: boolean = false;
  pacientes: Paciente[] = [];
  otraEspecialidad: string = '';
  
  constructor(private sanitizer: DomSanitizer, public especialistaService: EspecialistaService, private turnosService: TurnosService, private router: Router, private fb: FormBuilder, private authService: AuthService, private pacienteService: PacienteService, private auth: Auth) {
    this.currentUser$ = this.authService.getCurrentUser();
    this.formSubmitted = false;

    this.solicitarTurnoForm = this.fb.group({
      especialidad: ['', Validators.required],
      especialista: ['', Validators.required],
      date: ['', Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
      paciente: ['']
    });

    this.fetchTurnosDisponibles();

  }

  async ngOnInit() 
  {
    this.inicializarEspecialidadesConImagenes();

    // this.inicializarEspecialidades();
    // this.especialidadSeleccionada = false;

    this.currentUser$.subscribe(async user => {
      if (user) {
        this.authService.getUserRole().subscribe(role => {
          this.isAdmin = role === 'admin';
          if (this.isAdmin) {
            this.authService.obtenerPacientes().subscribe(pacientes => {
              this.pacientes = pacientes;
              console.log('Pacientes obtenidos:', this.pacientes);
            });
          }
        });
        this.especialistaService.getEspecialistas().subscribe(especialistas => {
          this.especialistas = especialistas;
        });
        this.fetchTurnosDisponibles();
      } else {
        console.error('No hay un usuario autenticado');
      }
    });

    this.currentUser$.subscribe(async user => {
      if (user) {
        const especialistaId = user.uid;
        await this.cargarHorariosAceptados(especialistaId);
        this.obtenerTurnosDisponibles(especialistaId);
      } else {
        console.error('No hay un usuario autenticado');
      }
    });

    setTimeout(() => {
      this.showLoading = false;
    }, 2000);
  }

  public onClickHome(event: any): void 
  {
    this.router.navigate(['home']);
  }


  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    this.showLogoutButton = this.isDropdownOpen; 
  }

  getFormattedTurno(turno: TurnoDisponible): string {
    const dateStr = turno.dias[0];
    const [day, month, year] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const formattedDate = format(date, 'yyyy-MM-dd');
    const horaInicio = this.formatTime(turno.horaInicio);
    const horaFin = this.formatTime(turno.horaFin);

    return `${formattedDate} ${horaInicio} - ${horaFin}`;
  }

  formatTime(time: string): string {
    if (!time || typeof time !== 'string') {
      console.error('Invalid time value:', time);
      return '';
    }
  
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      console.error('Invalid time value:', time);
      return '';
    }
  
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
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
          await this.auth.signOut();
          this.router.navigate(['/login']);
        } catch (error) {
          console.error('Error al cerrar sesión:', error);
        }
      } else {

      }
    });
  }


  private async cargarHorariosAceptados(especialistaId: string) {
    try {
      const turnosAceptados = await this.turnosService.obtenerTurnosAceptadosPorEspecialista(especialistaId);
      this.horariosAceptados = turnosAceptados
        .filter((turno: Turno) => 
          turno.estado === 'aceptado' &&
          this.isValidDate(this.convertToDate(turno.fechaHora)) &&
          this.isValidTime(turno.horaInicio ?? '') &&
          this.isValidTime(turno.horaFin ?? '')
        )
        .map((turno: Turno) => ({
          fecha: this.formatDate(this.convertToDate(turno.fechaHora)),
          horaInicio: turno.horaInicio ?? '',
          horaFin: turno.horaFin ?? ''
        }));
      console.log('Horarios aceptados:', this.horariosAceptados); // Verificación
    } catch (error) {
      console.error('Error al cargar horarios aceptados:', error);
    }
  }

  obtenerTurnosDisponibles(especialistaId: string): void {
    this.turnosService.obtenerTurnosDisponiblesParaEspecialista(especialistaId)
      .then((turnosDisponibles: TurnoDisponible[]) => {
        const turnosFiltrados = turnosDisponibles.map(turno => {
          const fecha = `${this.selectedDay.getFullYear()}-${(this.selectedDay.getMonth() + 1).toString().padStart(2, '0')}-${this.selectedDay.getDate().toString().padStart(2, '0')}`;
          const ocupado = this.horariosAceptados.some(aceptado => {
            return aceptado.fecha === fecha && 
                   aceptado.horaInicio === turno.horaInicio && 
                   aceptado.horaFin === turno.horaFin;
          });
          return {
            ...turno,
            ocupado
          };
        });

        this.turnosDisponibles = turnosFiltrados;
        console.log('Turnos disponibles para el especialista:', this.turnosDisponibles);
      })
      .catch((error: any) => {
        console.error('Error al obtener turnos disponibles:', error);
      });
  }

  
  // toggleEspecialidad(index: number) {
  //   if (this.especialidadIndex === index) {

  //     this.especialidadSeleccionada = !this.especialidadSeleccionada;
  //   } else {

  //     this.especialidadSeleccionada = true;
  //     this.especialidadIndex = index;
  //   }
  // }

  onPacienteChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedEmail = target.value;
    this.solicitarTurnoForm.patchValue({ paciente: selectedEmail });
    console.log('Paciente seleccionado:', selectedEmail); // Para depuración
  }

  onEspecialistaButtonClick(especialista: any) {
    this.especialistaSeleccionado = especialista;
    this.especialistaService.obtenerEspecialidadesPorEspecialista(especialista.id).subscribe(especialidades => {
      this.especialidades = especialidades;
    });

    this.solicitarTurnoForm.patchValue({
      especialista: especialista.id
    });

    this.turnosService.obtenerTurnosDisponiblesParaEspecialista(especialista.id).then(turnos => {
      this.turnosDisponibles = turnos;
      console.log('Turnos disponibles:', this.turnosDisponibles);
    }).catch(error => {
      console.error('Error al obtener turnos disponibles:', error);
    });
  }
  

  onEspecialidadButtonClick(especialidad: string) {
    this.especialidadActual = especialidad;
    this.solicitarTurnoForm.patchValue({
      especialidad: this.especialidadActual
    });
  }

  obtenerEspecialidadesPorEspecialista(especialistaId: string) {
    this.especialistaService.obtenerEspecialidadesPorEspecialista(especialistaId).subscribe(especialidades => {
      this.especialidades = especialidades;
      console.log('Especialidades obtenidas:', especialidades);
    });
  }

  inicializarEspecialidadesConImagenes() {
    this.especialidadesConImagenes = {
      ginecología: 'assets/imagenesEspecialidades/ginecologia.png',
      kinesiología: 'assets/imagenesEspecialidades/kinesiologia.png',
      nutricionista: 'assets/imagenesEspecialidades/nutricionista.png',
      cardiología: 'assets/imagenesEspecialidades/cardiologia.png',
    };
  }

  // onEspecialidadButtonClick(especialidad: string) {

  //   this.seleccionado = especialidad === this.seleccionado ? null : especialidad;
  //   this.especialistaSeleccionadoHorario = false;  
  //   this.solicitarTurnoForm.patchValue({
  //     especialidad: especialidad
  //   });
  // }

  guardarFechaYHora() {
    const fechaSeleccionada = this.selectedDay;
    const horaInicio = this.solicitarTurnoForm.get('horaInicio')?.value;
    const fechaHoraString = `${fechaSeleccionada.getFullYear()}-${fechaSeleccionada.getMonth() + 1}-${fechaSeleccionada.getDate()} ${horaInicio}`;
  
    this.solicitarTurnoForm.patchValue({
      date: fechaHoraString
    });

  }

  formatFechaHora(fecha: string, horaInicio: string, horaFin: string): string {
    const fechaFormateada = format(new Date(fecha), 'EEEE dd/MM/yy', { locale: es });
    return `${fechaFormateada} - ${horaInicio} a ${horaFin}`;
  }

  validarYConvertirHora(hora: string): string {
    const horaPartes = hora.split(':');
    let horas = parseInt(horaPartes[0], 10);
    let minutos = parseInt(horaPartes[1], 10);
    if (minutos === 60) {
      horas++;
      minutos = 0;
    }
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  }

  private convertToDate(date: Date | Timestamp): Date {
    return date instanceof Timestamp ? date.toDate() : date;
  }

  // private formatDate(date: Date | Timestamp): string {
  //   const dateObj = date instanceof Timestamp ? date.toDate() : date;
  //   return format(dateObj, 'yyyy-MM-dd');
  // }

  // private formatDate(date: Date | Timestamp): string {
  //   const dateObj = date instanceof Timestamp ? date.toDate() : (typeof date === 'string' ? new Date(date) : date);
  //   return format(dateObj, 'yyyy-MM-dd');
  // }
  private formatDate(date: Date | string): string {
    let dateObj: Date;
  
    if (typeof date === 'string') {
      // Intenta parsear la fecha usando el formato conocido
      dateObj = parse(date, 'EEEE dd-MM-yyyy', new Date(), { locale: es });
    } else if (date instanceof Timestamp) {
      dateObj = date.toDate();
    } else {
      dateObj = date;
    }
  
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date value:', date);
      return '';
    }
  
    return format(dateObj, 'yyyy-MM-dd');
  }
  

  private isValidDate(date: Date | Timestamp): boolean {
    const dateObj = date instanceof Timestamp ? date.toDate() : date;
    return !isNaN(dateObj.getTime());
  }
  
  private isValidTime(time: string): boolean {
    return /^([01]\d|2[0-3]):?([0-5]\d)$/.test(time);
  }

  async fetchTurnosDisponibles() {
    if (this.especialistaSeleccionado) {
      try {
        this.turnosDisponibles = await this.turnosService.obtenerTurnosDisponiblesParaEspecialista(this.especialistaSeleccionado.id);
        this.cargarHorariosAceptados(this.especialistaSeleccionado.id);
      } catch (error) {
        console.error('Error fetching turnos disponibles:', error);
      }
    }
  }

  // isTurnoOcupado(turno: TurnoDisponible): boolean {
  //   const turnoFecha = this.formatDate(new Date(turno.dias[0]));
  //   return this.horariosAceptados.some(aceptado =>
  //     aceptado.fecha === turnoFecha &&
  //     aceptado.horaInicio === turno.horaInicio &&
  //     aceptado.horaFin === turno.horaFin
  //   );
  // }

  isTurnoOcupado(turno: TurnoDisponible): boolean {
    const turnoFecha = this.formatDate(turno.dias[0]);
    if (!turnoFecha) {
      return true; // O considerarlo no ocupado, dependiendo de tu lógica
    }
    return this.horariosAceptados.some(aceptado =>
      aceptado.fecha === turnoFecha &&
      aceptado.horaInicio === turno.horaInicio &&
      aceptado.horaFin === turno.horaFin
    );
  }
  
  onEspecialidadButtonClick1(especialista: any) {
    this.especialistaSeleccionado = especialista;
    this.especialistaSeleccionado = this.especialistaSeleccionado === especialista ? null : especialista;
    this.verificarDisponibilidad();
    this.especialistaSeleccionadoHorario = true;
    //console.log('Especialista seleccionado:', this.especialistaSeleccionado);
  
    if (this.especialistaSeleccionado) {
      this.solicitarTurnoForm.patchValue({
        especialistaNombre: this.especialistaSeleccionado.nombre || '',
        especialistaApellido: this.especialistaSeleccionado.apellido || '',
        especialista: this.especialistaSeleccionado.id || ''
      });

      const especialistaId = this.especialistaSeleccionado.id;
      //console.log('Especialista ID seleccionado:', especialistaId);  // Asegúrate de que el ID no es undefined
      if (especialistaId) {
        this.especialistaService.getEspecialistaInfo(especialistaId)
          .subscribe(
            especialistasInfo => {

              console.log('Información del especialista:', especialistasInfo);
            },
            error => {
              console.error('Error al obtener la información del especialista:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo obtener la información del especialista. Por favor, intenta nuevamente.'
              });
            }
          );

        this.turnosService.obtenerTurnosDisponiblesParaEspecialista(especialistaId)
          .then((turnosDisponibles: TurnoDisponible[]) => {
            const turnosFiltrados = turnosDisponibles.map(turno => ({
              ...turno,
              horaInicio: this.validarYConvertirHora(turno.horaInicio),
              horaFin: this.validarYConvertirHora(turno.horaFin)
            }));
    
            this.turnosDisponibles = turnosFiltrados;

            if (this.solicitarTurnoForm) {
              this.solicitarTurnoForm.patchValue({
                date: '', 
                horaInicio: '', 
                horaFin: '', 
              });
            }
    
            //console.log('Turnos disponibles válidos:', this.turnosDisponibles);
          })
          .catch(error => {
            console.error('Error al obtener turnos disponibles:', error);
            this.turnosDisponibles = [];
          });
      } else {
        console.error('El ID del especialista es inválido.');
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'El ID del especialista es inválido. Por favor, selecciona un especialista válido.'
        });
      }
    }
  }


  validarYConvertirFecha(fecha: string): Date | string {
  
    if (!fecha) {
      console.warn('La fecha recibida está vacía o es indefinida.');
      return 'Fecha vacía o indefinida';
    }
  
    const fechaConvertida = new Date(fecha);

    if (isNaN(fechaConvertida.getTime())) {
      console.error('Fecha inválida:', fecha);
      return 'Invalid Date';
    } else {
      console.log('Fecha convertida:', fechaConvertida.toISOString());
      return fechaConvertida;
    }
  }

  onTurnoSeleccionado(turno: TurnoDisponible) {
    try {
      const fechaConvertida = parse(turno.dias[0], 'EEEE dd-MM-yyyy', new Date(), { locale: es });
      if (isNaN(fechaConvertida.getTime())) {
        throw new Error('Invalid date');
      }
      const fechaFormateada = format(fechaConvertida, 'EEEE dd/MM/yyyy', { locale: es });
  
      this.solicitarTurnoForm.patchValue({
        date: fechaFormateada, 
        horaInicio: turno.horaInicio,
        horaFin: turno.horaFin
      });
  
      this.turnoSeleccionado = turno;
    } catch (error) {
      console.error('Error in onTurnoSeleccionado:', error);
    }
  }

  getSafeImageURL(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  obtenerImagenEspecialista(especialista: any): string {

    return especialista.imagenPerfil || '';
  }

  obtenerImagenEspecialidad(especialidad: string): string {
    return this.especialidadesConImagenes[especialidad.trim().toLowerCase()] || '';
  }

  async inicializarEspecialidades() {

    await this.obtenerEspecialidades();
  
    for (const especialidad of this.especialidades) {
      const nombreEspecialidad = especialidad.toLowerCase();

      const rutaImagen = `assets/imagenesEspecialidades/${nombreEspecialidad}.png`;

      this.especialidadesConImagenes[nombreEspecialidad] = rutaImagen;

    }
  }

  obtenerEspecialidades() {
    this.authService.obtenerListaEspecialidades().then((especialidades) => {
      this.especialidades = especialidades;
    }).catch((error) => {
      console.error('Error al obtener especialidades:', error);
    });
  }

  onEspecialidadChange(especialidad: string) {
    if (especialidad) {
      this.authService.obtenerEspecialistasPorEspecialidad(especialidad)
        .then((especialistas: { id: string; nombre: string; apellido: string; imagenPerfil: string }[]) => {
          if (especialistas.length > 0) {
            this.especialistas = especialistas;
          } else {
            console.warn('No se encontraron especialistas para la especialidad seleccionada.');
          }
        })
        .catch(error => {
          console.error('Error al obtener especialistas:', error);
        });
    } else {
      console.warn('Especialidad seleccionada no válida.');
    }
  }

  onFechaChange(event: any): void {
    this.fechaSeleccionada = new Date(event.target.value);
    this.verificarDisponibilidad();
  }

  async verificarDisponibilidad(): Promise<void> {
    if (this.especialistaSeleccionado && this.fechaSeleccionada) {
      console.log('Verificando disponibilidad para especialista:', this.especialistaSeleccionado.id, 'fecha:', this.fechaSeleccionada);
      const result = await this.turnosService.obtenerTurnosDisponiblesParaEspecialista(this.especialistaSeleccionado.id);
      this.turnosDisponibles = result;

      this.turnosService.obtenerTurnosPorEspecialista(this.especialistaSeleccionado.id).subscribe((turnos: Turno[]) => {
        this.horariosAceptados = turnos.filter((turno: Turno) => turno.estado === 'aceptado')
          .map((turno: Turno) => ({
            fecha: this.formatDate(this.convertToDate(turno.fechaHora)),
            horaInicio: turno.horaInicio ?? '',
            horaFin: turno.horaFin ?? ''
          }));
        console.log('Horarios aceptados:', this.horariosAceptados);

        this.turnosDisponibles.forEach(turno => {
          turno.ocupado = this.horariosAceptados.some(aceptado =>
            aceptado.fecha === this.formatDate(new Date(turno.dias[0])) &&
            aceptado.horaInicio === turno.horaInicio &&
            aceptado.horaFin === turno.horaFin
          );
        });
      });

      console.log('Turnos disponibles:', this.turnosDisponibles);
    }
  }
    


  guardarTurno() {
    const formValues = this.solicitarTurnoForm.value;
    const fechaTurno = this.construirFechaTurno(formValues.date, formValues.horaInicio);
    
    if (!fechaTurno) {
      this.mostrarMensajeError('La fecha y hora del turno no son válidas.');
      return;
    }
  
    const especialidadSeleccionada = formValues.especialidad;
    const especialistaSeleccionado = formValues.especialista;
  
    if (!especialidadSeleccionada || !especialistaSeleccionado) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, seleccione una especialidad y un especialista antes de solicitar el turno.'
      });
      return;
    }
  
    this.pacienteService.getPacienteInfo().subscribe(
      pacienteInfo => {
        console.log('Paciente Info:', pacienteInfo);
        this.especialistaService.getEspecialistaInfo(especialistaSeleccionado).subscribe(
          especialistasInfo => {
            console.log('Especialista Info:', especialistasInfo);
            this.turnosService.solicitarTurno(
              especialidadSeleccionada,
              especialistaSeleccionado,
              fechaTurno,
              formValues.horaInicio,
              formValues.horaFin,
              pacienteInfo.mail,
              pacienteInfo.nombre,
              pacienteInfo.apellido,
              especialistasInfo.mail,
              especialistasInfo.nombre,
              especialistasInfo.apellido
            ).then(() => {
              this.solicitarTurnoForm.reset();
              Swal.fire({
                icon: 'success',
                title: 'Turno solicitado con éxito',
                text: 'Tu turno ha sido solicitado correctamente.',
                confirmButtonText: 'OK'
              }).then(() => {
                this.router.navigate(['/home/mis-turnos']);
              });
            }).catch(error => {
              console.error('Error al solicitar el turno:', error); 
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema al solicitar el turno. Por favor, intenta nuevamente.'
              });
            });
          },
          
          error => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo obtener la información del especialista. Por favor, intenta nuevamente.'
            });
          }
        );
      },
      // error => {
      //   Swal.fire({
      //     icon: 'error',
      //     title: 'Error',
      //     text: 'No se pudo obtener la información del paciente. Por favor, intenta nuevamente.'
      //   });
      // }
    );
  }

  guardarTurnoAdmin() {
    const formValues = this.solicitarTurnoForm.value;
    const fechaTurno = this.construirFechaTurno(formValues.date, formValues.horaInicio);
  
    if (!fechaTurno) {
      this.mostrarMensajeError('La fecha y hora del turno no son válidas.');
      return;
    }
  
    const especialidadSeleccionada = this.solicitarTurnoForm.get('especialidad')?.value;
    const especialistaSeleccionado = this.solicitarTurnoForm.get('especialista')?.value;
    const pacienteSeleccionado = this.solicitarTurnoForm.get('paciente')?.value;
  
    if (!especialidadSeleccionada || !especialistaSeleccionado) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, seleccione una especialidad y un especialista antes de solicitar el turno.'
      });
      return;
    }
  
    const processTurno = (pacienteInfo: any) => {
      this.especialistaService.getEspecialistaInfo(especialistaSeleccionado).subscribe(
        especialistasInfo => {
          this.turnosService.solicitarTurno(
            especialidadSeleccionada,
            especialistaSeleccionado,
            fechaTurno,
            formValues.horaInicio,
            formValues.horaFin,
            pacienteInfo.email,
            pacienteInfo.nombre,
            pacienteInfo.apellido,
            especialistasInfo.mail,
            especialistasInfo.nombre,
            especialistasInfo.apellido
          ).then(() => {
            this.solicitarTurnoForm.reset();
            Swal.fire({
              icon: 'success',
              title: 'Turno solicitado con éxito',
              text: 'Tu turno ha sido solicitado correctamente.',
              confirmButtonText: 'OK'
            }).then(() => {
              if (this.isAdmin) {
                this.router.navigate(['/home/turnos']);
              } else {
                this.router.navigate(['/home/mis-turnos']);
              }
            });
          }).catch(error => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un problema al solicitar el turno. Por favor, intenta nuevamente.'
            });
          });
        },
        error => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener la información del especialista. Por favor, intenta nuevamente.'
          });
        }
      );
    };
  
    if (pacienteSeleccionado) {
      // Si el administrador seleccionó un paciente
      const selectedPaciente = this.pacientes.find(p => p.email === pacienteSeleccionado);
      if (selectedPaciente) {
        processTurno(selectedPaciente);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo encontrar la información del paciente seleccionado. Por favor, intenta nuevamente.'
        });
      }
    } else {
      // Si el usuario autenticado está solicitando el turno
      this.pacienteService.getPacienteInfo().subscribe(
        pacienteInfo => {
          processTurno(pacienteInfo);
        },
        error => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener la información del paciente. Por favor, intenta nuevamente.'
          });
        }
      );
    }
  }
  
  construirFechaTurno(date: string, hora: string): Date | null {
    try {
      const [dayOfWeek, dayMonthYear] = date.split(' ');
      const [day, month, year] = dayMonthYear.split('/').map(Number);
      const [hour, minute] = hora.split(':').map(Number);
  
      const fechaTurno = new Date(year, month - 1, day, hour, minute);
      return fechaTurno;
    } catch (error) {
      console.error('Error al construir fecha de turno:', error);
      return null;
    }
  }

  obtenerInformacionPaciente(pacienteId: number) {
    this.turnosService.obtenerPacientePorId(pacienteId).subscribe(
      pacienteData => {
        if (pacienteData) {
          console.log('Información del paciente:', pacienteData);

        } else {
          this.mostrarMensajeError(`No se encontró información para el paciente con ID ${pacienteId}`);
        }
      },
      error => {
        console.error('Error al obtener la información del paciente:', error);
        this.mostrarMensajeError('Ocurrió un error al obtener la información del paciente. Por favor, intenta de nuevo más tarde.');
      }
    );
  }

  mostrarMensajeError(mensaje: string) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje
    });
  }
}