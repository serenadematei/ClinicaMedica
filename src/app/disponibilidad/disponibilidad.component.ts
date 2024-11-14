import { Component, OnInit } from '@angular/core';
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

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-disponibilidad',
  templateUrl: './disponibilidad.component.html',
   styleUrl: './disponibilidad.component.css',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, CommonModule],
})
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
 