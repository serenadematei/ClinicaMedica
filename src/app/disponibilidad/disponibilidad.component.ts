import { Component, OnInit } from '@angular/core';
import { AbstractControl, ValidatorFn } from '@angular/forms';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ValidationErrors } from '@angular/forms';
import { Firestore, doc, updateDoc, collection, query, where, getDocs, getDoc} from '@angular/fire/firestore';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { ReactiveFormsModule} from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Auth } from '@angular/fire/auth';
import { Timestamp } from 'firebase/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function horaEnRangoValidator(min: string, max: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const horaIngresada = control.value;
    return (horaIngresada >= min && horaIngresada <= max)
      ? null
      : { fueraDeRango: true }; // Error si está fuera del rango
  };
}


@Component({
  selector: 'app-disponibilidad',
  templateUrl: './disponibilidad.component.html',
   styleUrl: './disponibilidad.component.css',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, CommonModule, FormsModule],
})


export class DisponibilidadComponent implements OnInit{

  userId: string = ''; 

  especialidades: string[] = []; 

  mostrarSnackbar = false;
  usuarioActual: any = null;
  esEspecialista: boolean = false;
  esAdmin: boolean = false;
  esPaciente: boolean = false;
  mostrarDisponibilidad: boolean = false; 
  nombreUsuarioActual: string = '';
  apellidoUsuarioActual: string = '';



  disponibilidadForm: FormGroup;
  proximosDias: { dia: string; fecha: Date }[] = [];
  fechasHasta: { dia: string; fecha: Date }[] = [];
  mostrarInputSabado = false; // Para manejar inputs dinámicos de sábados
  horaMinima: string = '08:00';
  horaMaxima: string = '19:00';





  mostrarHistoriaClinica: boolean = false;
  historiasClinicas: any[] = []; 
  historiasClinicasPDF: any[] = []; 
  logoUrl: string = '/assets/logo.jpeg';


  //nueva
  especialidadesTurnos: string[] = []; // Lista de especialidades tomadas por el paciente
  especialidadSeleccionada: string = ''; // Especialidad seleccionada para el filtro
  mailUsuarioActual: string = '';

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private authService: AuthService,
    private router: Router,
    private auth: Auth
  ) {
    this.disponibilidadForm = this.fb.group({
      especialidadSeleccionada: ['', Validators.required],
      desde: ['', Validators.required],
      hasta: ['', Validators.required],
      horaInicio: ['', [Validators.required, horaEnRangoValidator('08:00', '18:30')]],
      horaFin: ['', [Validators.required, horaEnRangoValidator('09:00', '19:00')]],
      duracionTurno: [30, [Validators.required, Validators.min(10)]],
      horaInicioSabado: ['08:00', [Validators.required, horaEnRangoValidator('08:00', '13:30')]],
      horaFinSabado: ['14:00', [Validators.required, horaEnRangoValidator('08:30', '14:00')]]
    });
    
  }

    ngOnInit(): void {
      this.cargarProximosDias();
      this.cargarUsuarioActual();
      this.cargarEspecialidadesDeTurnos(); //neuvo
  
      // Escucha cambios en "Desde"
      this.disponibilidadForm.get('desde')?.valueChanges.subscribe(() => {
        this.actualizarFechasHasta();
      });
  
      // Escucha cambios en "Hasta"
      this.disponibilidadForm.get('hasta')?.valueChanges.subscribe(() => {
        const desdeFecha = new Date(this.disponibilidadForm.get('desde')?.value);
        const hastaFecha = new Date(this.disponibilidadForm.get('hasta')?.value);
  
        if (desdeFecha && hastaFecha) {
          this.actualizarLimitesHorarios(desdeFecha, hastaFecha);
        }
      });

    
    }

  


    actualizarLimitesHorarios(desde: Date, hasta: Date) {
      this.mostrarInputSabado = false;
  
      for (let d = new Date(desde); d <= hasta; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 6) { // Si es sábado
          this.mostrarInputSabado = true;
        }
      }
    }


    cargarProximosDias() {
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const hoy = new Date();
    
      for (let i = 0; i < 15; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + i);
  
        if (fecha.getDay() !== 0) { // Excluir domingos
          const dia = `${diasSemana[fecha.getDay()]} ${fecha.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}`;
          this.proximosDias.push({ dia, fecha });
        }
      }
    }



    actualizarFechasHasta() {
      const desdeFecha = new Date(this.disponibilidadForm.get('desde')?.value);
      this.fechasHasta = this.proximosDias.filter(dia => dia.fecha >= desdeFecha);
  
      const hastaFecha = new Date(this.disponibilidadForm.get('hasta')?.value || desdeFecha);
      this.actualizarLimitesHorarios(desdeFecha, hastaFecha);
    }
  

 

      generarIntervalos(horaInicio: string, horaFin: string, duracion: number): string[] {
        const intervalos: string[] = [];
        let [horaI, minutoI] = horaInicio.split(':').map(Number);
        const [horaF, minutoF] = horaFin.split(':').map(Number);
    
        while (horaI < horaF || (horaI === horaF && minutoI < minutoF)) {
          intervalos.push(`${horaI.toString().padStart(2, '0')}:${minutoI.toString().padStart(2, '0')}`);
          minutoI += duracion;
          if (minutoI >= 60) {
            minutoI -= 60;
            horaI += 1;
          }
        }
    
        return intervalos;
      }



  async cargarHistoriasClinicas() {
    try {
      this.historiasClinicasPDF = await this.authService.obtenerHistoriasClinicasPorPaciente(this.usuarioActual.mail);
    } catch (error) {
      console.log("Error al cargar las historias clínicas para el pdf");
    }
  }

  toggleDisponibilidad() {
    this.mostrarDisponibilidad = !this.mostrarDisponibilidad;
  }


  // Cargar la información del usuario actual y determinar el rol
  async cargarUsuarioActual() {
    try {
      const user = await this.authService.obtenerInfoUsuarioActual1();
      if (user) {
        this.usuarioActual = user;
        this.userId = user.id;
        this.especialidades = user.especialidades || [];
        this.esEspecialista = user.role === 'especialista';
        this.esAdmin = user.role === 'admin';
        this.esPaciente = user.role === 'paciente';
        this.nombreUsuarioActual = user.nombre;
        this.apellidoUsuarioActual = user.apellido;

      } else {
        console.error('Usuario no autenticado o no encontrado.');
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error("Error al cargar los datos del usuario:", error);
    }
  }


    async guardarDisponibilidad() {
      if (this.disponibilidadForm.invalid || !this.userId) {
        console.log("Formulario inválido o ID de usuario no encontrado.");
        return;
      }
    
      const especialidadSeleccionada = this.disponibilidadForm.get('especialidadSeleccionada')?.value;
      const desdeFecha = new Date(this.disponibilidadForm.get('desde')?.value);
      const hastaFecha = new Date(this.disponibilidadForm.get('hasta')?.value);
      const horaInicio = this.disponibilidadForm.get('horaInicio')?.value;
      const horaFin = this.disponibilidadForm.get('horaFin')?.value;
      const duracionTurno = +this.disponibilidadForm.get('duracionTurno')?.value;
      const horaInicioSabado = this.disponibilidadForm.get('horaInicioSabado')?.value || '08:00';
      const horaFinSabado = this.disponibilidadForm.get('horaFinSabado')?.value || '14:00';
    
      console.log("Iniciando guardado de disponibilidad...");
      console.log(`Rango de fechas seleccionado: Desde ${desdeFecha.toISOString()} hasta ${hastaFecha.toISOString()}`);
      console.log(`Hora inicio: ${horaInicio}, Hora fin: ${horaFin}, Duración: ${duracionTurno} minutos`);
    
      try {
        const userDocRef = doc(this.firestore, 'DatosUsuarios', this.userId);
        const userDoc = await getDoc(userDocRef);
        let disponibilidadActual = userDoc.exists() && userDoc.data()?.['disponibilidad'] ? userDoc.data()?.['disponibilidad'] : [];
    
        for (let d = new Date(desdeFecha); d <= hastaFecha; d.setDate(d.getDate() + 1)) {
          if (d.getDay() === 0) {
            // Ignorar domingos
            console.log(`Ignorando domingo: ${d.toISOString()}`);
            continue;
          }
    
          const fechaISO = d.toISOString(); // Formato ISO 8601
          const esSabado = d.getDay() === 6;
    
          console.log(`Procesando fecha: ${fechaISO} (${esSabado ? "sábado" : "día laborable"})`);
    
          const intervalos = esSabado
            ? this.generarIntervalos(horaInicioSabado, horaFinSabado, duracionTurno)
            : this.generarIntervalos(horaInicio, horaFin, duracionTurno);
    
          if (!intervalos || intervalos.length === 0) {
            console.warn(`Sin horarios válidos generados para la fecha: ${fechaISO}`);
            continue;
          }
    
          console.log(`Horarios generados para la fecha ${fechaISO}: ${intervalos.join(", ")}`);
    
          // Buscar si ya existe disponibilidad para esta fecha
          const disponibilidadParaFecha = disponibilidadActual.find(
            (disp: any) => disp.fechaSeleccionada === fechaISO
          );
    
          if (disponibilidadParaFecha) {
            console.log(`Actualizando horarios existentes para la fecha: ${fechaISO}`);
            disponibilidadParaFecha.horarios.push(...intervalos);
          } else {
            console.log(`Creando nueva disponibilidad para la fecha: ${fechaISO}`);
            disponibilidadActual.push({
              fechaSeleccionada: fechaISO,
              especialidad: especialidadSeleccionada,
              horarios: intervalos
            });
          }
        }
    
        console.log("Actualizando base de datos con la siguiente disponibilidad:", disponibilidadActual);
        await updateDoc(userDocRef, { disponibilidad: disponibilidadActual });
    
        console.log("Disponibilidad guardada exitosamente.");
        this.mostrarSnackbar = true;
        setTimeout(() => {
          this.mostrarSnackbar = false;
        }, 3000);
    
        this.disponibilidadForm.reset({ duracionTurno: 30 });
      } catch (error) {
        console.error("Error al guardar la disponibilidad:", error);
      }
    }


  toggleHistoriaClinica() {
    this.mostrarHistoriaClinica = !this.mostrarHistoriaClinica;
    if (this.mostrarHistoriaClinica) {
      this.cargarHistoriaClinica();
    }
  }
  
  async cargarHistoriaClinica() {
    try {
      const historias = await this.authService.obtenerHistoriasClinicasPorPaciente(this.usuarioActual.mail);
      this.historiasClinicas = historias;
      this.historiasClinicas = historias.map(historia => ({
        ...historia,
        fecha: historia.fecha instanceof Timestamp ? historia.fecha.toDate() : historia.fecha,
        datosDinamicos: Array.isArray(historia.datosDinamicos) ? historia.datosDinamicos : []
      }));
    } catch (error) {
      console.error("Error al cargar la historia clínica:", error);
    }
  }

  async generarPDF() {
    await this.cargarHistoriasClinicas();
  
    const doc = new jsPDF();
    
    // Define las coordenadas y el tamaño del logo
    const logoX = 10, logoY = 10, logoSize = 30;
  
    // Dibuja un círculo de fondo para simular el borde redondeado
    doc.setDrawColor(255, 255, 255);
    doc.setFillColor(255, 255, 255); // Blanco para el círculo
    doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 2, 'F');
  
    // Inserta el logo encima del círculo
    doc.addImage(this.logoUrl, 'JPEG', logoX, logoY, logoSize, logoSize);
  
    // Agrega el título del informe con el nombre del paciente
    const nombrePaciente = `${this.nombreUsuarioActual} ${this.apellidoUsuarioActual}` || 'Paciente';
    doc.setFontSize(18);
    doc.text(`Historia Clínica del Paciente: ${nombrePaciente}`, 50, 25);
  
    // Fecha de emisión en español
    const fechaEmision = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.setFontSize(12);
    doc.text(`Fecha de emisión: ${fechaEmision}`, 50, 35);
  
    // Espacio adicional antes de la tabla
    const startY = 45;
  
    // Estructura los datos de las historias clínicas
    const rows = this.historiasClinicasPDF.map(historia => [
      historia.fecha instanceof Date ? historia.fecha.toLocaleDateString('es-ES') : historia.fecha.toDate().toLocaleDateString('es-ES'),
      `${historia.altura} cm`,
      `${historia.peso} kg`,
      `${historia.temperatura} °C`,
      historia.presion,
      historia.datosDinamicos?.map((d: { clave: string; valor: string }) => `• ${d.clave}: ${d.valor}`).join('\n') || ''
    ]);
  
    // Tabla de historias clínicas
    autoTable(doc, {
      startY: startY,
      head: [['Fecha', 'Altura', 'Peso', 'Temperatura', 'Presión', 'Datos Adicionales']],
      body: rows,
      margin: { top: startY }
    });
  
    // Descarga el PDF
    doc.save(`historia_clinica_${nombrePaciente}.pdf`);
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

  async descargarTurnosPorEspecialidad() {
    try {
      const turnos = await this.authService.obtenerTurnosPorPaciente(this.usuarioActual.mail);
      const turnosFiltrados = turnos.filter(turno => turno.especialidad === this.especialidadSeleccionada);
  
      if (turnosFiltrados.length === 0) {
        Swal.fire('Sin turnos', `No hay turnos registrados para la especialidad ${this.especialidadSeleccionada}.`, 'info');
        return;
      }
  
      const doc = new jsPDF();
  
      const logoX = 10, logoY = 10, logoSize = 30;
      doc.addImage(this.logoUrl, 'JPEG', logoX, logoY, logoSize, logoSize);
  
      doc.setFontSize(18);
      doc.text(`Turnos de ${this.especialidadSeleccionada} - ${this.nombreUsuarioActual} ${this.apellidoUsuarioActual}`, 50, 25);
  
      const fechaEmision = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.setFontSize(12);
      doc.text(`Fecha de emisión: ${fechaEmision}`, 50, 35);
  
      const rows = turnosFiltrados.map(turno => [
        turno.fechaHora instanceof Timestamp
          ? turno.fechaHora.toDate().toLocaleDateString('es-ES')
          : new Date(turno.fechaHora.seconds * 1000).toLocaleDateString('es-ES'),
        turno.especialista?.nombre + ' ' + turno.especialista?.apellido || 'N/A',
       // turno.estado,
        turno.comentario || 'N/A'
      ]);
  
      autoTable(doc, {
        startY: 45,
        head: [['Fecha', 'Especialista', /*'Estado',*/'Reseña']],
        body: rows,
        margin: { top: 45 },
      });
  
      doc.save(`Turnos_${this.especialidadSeleccionada}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF por especialidad:', error);
      Swal.fire('Error', 'No se pudo generar el PDF.', 'error');
    }
  }

  

// Método para cargar las especialidades de los turnos del paciente
async cargarEspecialidadesDeTurnos(): Promise<void> {

  try {
    const email = await this.authService.getCurrentUserEmail2(); // Esperamos que se resuelva la promesa
    if (email) {
      this.mailUsuarioActual = email;
      //console.log("mail:" + this.mailUsuarioActual);
    } else {
      console.error("No se pudo obtener el email del usuario actual.");
      return; // Salimos del método si no hay email
    }

    //console.log("mail2:" + this.mailUsuarioActual);
    const turnos = await this.authService.obtenerTurnosPorPaciente(this.mailUsuarioActual);
    if (turnos && turnos.length > 0) {
      this.especialidadesTurnos = Array.from(new Set(turnos.map((t: any) => t.especialidad)));
    } else {
      console.warn("El usuario no tiene turnos registrados.");
      this.especialidadesTurnos = [];
    }
  } catch (error) {
    console.error("Error al cargar las especialidades de los turnos:", error);
  }
}

  public goTo(path: string): void {
    this.router.navigate([path]);
  }
}


/*
export class DisponibilidadComponent implements OnInit{
  disponibilidadForm: FormGroup;
  proximosDias: { dia: string; fecha: Date }[] = [];
  userId: string = ''; 
  intervalosDisponibles: string[] = [];
  especialidades: string[] = []; 
  duracionTurno = 30;
  mostrarSnackbar = false;
  usuarioActual: any = null;
  esEspecialista: boolean = false;
  esAdmin: boolean = false;
  esPaciente: boolean = false;
  mostrarDisponibilidad: boolean = false; 
  nombreUsuarioActual: string = '';
  apellidoUsuarioActual: string = '';

  mostrarHistoriaClinica: boolean = false;
  historiasClinicas: any[] = []; 
  historiasClinicasPDF: any[] = []; 
  logoUrl: string = '/assets/logo.jpeg';

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private authService: AuthService,
    private router: Router,
    private auth: Auth
  ) {
    this.disponibilidadForm = this.fb.group({
      especialidadSeleccionada: ['', Validators.required],
      fechaSeleccionada: ['', Validators.required],
      horario: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.cargarProximosDias();
    this.cargarUsuarioActual();
  }

  async cargarHistoriasClinicas() {
    try {
      this.historiasClinicasPDF = await this.authService.obtenerHistoriasClinicasPorPaciente(this.usuarioActual.mail);
    } catch (error) {
      console.log("Error al cargar las historias clínicas para el pdf");
    }
  }

  toggleDisponibilidad() {
    this.mostrarDisponibilidad = !this.mostrarDisponibilidad;
  }


  // Cargar la información del usuario actual y determinar el rol
  async cargarUsuarioActual() {
    try {
      const user = await this.authService.obtenerInfoUsuarioActual1();
      if (user) {
        this.usuarioActual = user;
        this.userId = user.id;
        this.especialidades = user.especialidades || [];
        this.esEspecialista = user.role === 'especialista';
        this.esAdmin = user.role === 'admin';
        this.esPaciente = user.role === 'paciente';
        this.nombreUsuarioActual = user.nombre;
        this.apellidoUsuarioActual = user.apellido;

      } else {
        console.error('Usuario no autenticado o no encontrado.');
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error("Error al cargar los datos del usuario:", error);
    }
  }

  cargarProximosDias() {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hoy = new Date();
    for (let i = 0; i < 15; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      if (fecha.getDay() !== 0) { 
        this.proximosDias.push({ dia: `${dias[fecha.getDay() - 1]} ${fecha.toLocaleDateString()}`, fecha });
      }
    }
  }


  generarIntervalosHorarios() {
    const fechaSeleccionada = new Date(this.disponibilidadForm.get('fechaSeleccionada')?.value);
    const dia = fechaSeleccionada.getDay();
    const esLaborable = dia >= 1 && dia <= 5;
    const horaInicio = 8;
    const horaFin = esLaborable ? 19 : 14;
    const intervalos = [];

    for (let h = horaInicio; h < horaFin; h++) {
      for (let m = 0; m < 60; m += this.duracionTurno) {
        const hora = h.toString().padStart(2, '0');
        const minutos = m.toString().padStart(2, '0');
        intervalos.push(`${hora}:${minutos}`);
      }
    }
    this.intervalosDisponibles = intervalos;
  }

  async guardarDisponibilidad() {
    if (this.disponibilidadForm.invalid || !this.userId) {
      console.log("Formulario inválido o ID de usuario no encontrado.");
      return;
    }

    const fechaSeleccionada = this.disponibilidadForm.get('fechaSeleccionada')?.value;
    const horario = this.disponibilidadForm.get('horario')?.value;
    const especialidadSeleccionada = this.disponibilidadForm.get('especialidadSeleccionada')?.value;

    try {
      const userDocRef = doc(this.firestore, 'DatosUsuarios', this.userId);
      const userDoc = await getDoc(userDocRef);
      let disponibilidadActual = userDoc.exists() && userDoc.data()?.['disponibilidad'] ? userDoc.data()?.['disponibilidad'] : [];
      
      const existeHorario = disponibilidadActual.some(
        (disp: any) => disp.fechaSeleccionada === fechaSeleccionada && disp.horarios.includes(horario)
      );

      if (existeHorario) {
        alert("Ya existe una disponibilidad para esta fecha y horario.");
        return;
      }

      const disponibilidadParaFecha = disponibilidadActual.find(
        (disp: any) => disp.fechaSeleccionada === fechaSeleccionada
      );

      if (disponibilidadParaFecha) {
        disponibilidadParaFecha.horarios.push(horario);
      } else {
        disponibilidadActual.push({
          fechaSeleccionada,
          especialidad: especialidadSeleccionada,
          horarios: [horario],
        });
      }

      await updateDoc(userDocRef, { disponibilidad: disponibilidadActual });
      this.mostrarSnackbar = true;
      setTimeout(() => {
        this.mostrarSnackbar = false;
      }, 3000);
      this.disponibilidadForm.get('horario')?.reset();
    } catch (error) {
      console.error("Error al guardar la disponibilidad:", error);
    }
  }



  toggleHistoriaClinica() {
    this.mostrarHistoriaClinica = !this.mostrarHistoriaClinica;
    if (this.mostrarHistoriaClinica) {
      this.cargarHistoriaClinica();
    }
  }
  
  async cargarHistoriaClinica() {
    try {
      const historias = await this.authService.obtenerHistoriasClinicasPorPaciente(this.usuarioActual.mail);
      this.historiasClinicas = historias;
      this.historiasClinicas = historias.map(historia => ({
        ...historia,
        fecha: historia.fecha instanceof Timestamp ? historia.fecha.toDate() : historia.fecha,
        datosDinamicos: Array.isArray(historia.datosDinamicos) ? historia.datosDinamicos : []
      }));
    } catch (error) {
      console.error("Error al cargar la historia clínica:", error);
    }
  }

  async generarPDF() {
    await this.cargarHistoriasClinicas();
  
    const doc = new jsPDF();
    
    // Define las coordenadas y el tamaño del logo
    const logoX = 10, logoY = 10, logoSize = 30;
  
    // Dibuja un círculo de fondo para simular el borde redondeado
    doc.setDrawColor(255, 255, 255);
    doc.setFillColor(255, 255, 255); // Blanco para el círculo
    doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 2, 'F');
  
    // Inserta el logo encima del círculo
    doc.addImage(this.logoUrl, 'JPEG', logoX, logoY, logoSize, logoSize);
  
    // Agrega el título del informe con el nombre del paciente
    const nombrePaciente = `${this.nombreUsuarioActual} ${this.apellidoUsuarioActual}` || 'Paciente';
    doc.setFontSize(18);
    doc.text(`Historia Clínica del Paciente: ${nombrePaciente}`, 50, 25);
  
    // Fecha de emisión en español
    const fechaEmision = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.setFontSize(12);
    doc.text(`Fecha de emisión: ${fechaEmision}`, 50, 35);
  
    // Espacio adicional antes de la tabla
    const startY = 45;
  
    // Estructura los datos de las historias clínicas
    const rows = this.historiasClinicasPDF.map(historia => [
      historia.fecha instanceof Date ? historia.fecha.toLocaleDateString('es-ES') : historia.fecha.toDate().toLocaleDateString('es-ES'),
      `${historia.altura} cm`,
      `${historia.peso} kg`,
      `${historia.temperatura} °C`,
      historia.presion,
      historia.datosDinamicos?.map((d: { clave: string; valor: string }) => `• ${d.clave}: ${d.valor}`).join('\n') || ''
    ]);
  
    // Tabla de historias clínicas
    autoTable(doc, {
      startY: startY,
      head: [['Fecha', 'Altura', 'Peso', 'Temperatura', 'Presión', 'Datos Adicionales']],
      body: rows,
      margin: { top: startY }
    });
  
    // Descarga el PDF
    doc.save(`historia_clinica_${nombrePaciente}.pdf`);
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

  public goTo(path: string): void {
    this.router.navigate([path]);
  }
}
 */