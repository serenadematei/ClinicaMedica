import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ValidationErrors } from '@angular/forms';
import { Firestore, doc, updateDoc, collection, query, where, getDocs, getDoc} from '@angular/fire/firestore';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { ReactiveFormsModule} from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-disponibilidad',
  templateUrl: './disponibilidad.component.html',
   styleUrl: './disponibilidad.component.css',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor],
})
export class DisponibilidadComponent implements OnInit{
  disponibilidadForm: FormGroup;
  proximosDias: { dia: string; fecha: Date }[] = [];
  userId: string = ''; // Se asigna el ID del usuario autenticado
  intervalosDisponibles: string[] = [];
  especialidades: string[] = []; // Especialidades del usuario autenticado
  duracionTurno = 30; // Duración predeterminada del turno en minutos
  mostrarSnackbar = false;

  constructor(private fb: FormBuilder, private firestore: Firestore, private authService:AuthService, private router:Router, private auth: Auth) {
    this.disponibilidadForm = new FormGroup({
      especialidadSeleccionada: new FormControl('', Validators.required),
      fechaSeleccionada: new FormControl('', Validators.required),
      horario: new FormControl('', Validators.required),
    });
  
    this.cargarEspecialidades(); // carga especialidades
  }

  ngOnInit(): void {
    this.cargarProximosDias();
    this.cargarEspecialidades(); // Obtener especialidades del usuario
    
      this.authService.obtenerInfoUsuarioActual1().then((user) => {
        if (user) {
          this.userId = user.id;
          console.log("ID de usuario obtenido:", this.userId);
        } else {
          console.log("Usuario no autenticado o no encontrado.");
        }
      });
    
  }
  cargarProximosDias() {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hoy = new Date();
  
    for (let i = 0; i < 15; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
  
      // Excluir domingos (donde getDay() === 0)
      if (fecha.getDay() !== 0) { 
        this.proximosDias.push({ dia: `${dias[fecha.getDay() - 1]} ${fecha.toLocaleDateString()}`, fecha });
      }
    }
  }

  // Cargar especialidades desde Firebase
  async cargarEspecialidades() {
    try {
      const usuarioActual = await this.authService.obtenerInfoUsuarioActual1(); // Obtener el usuario actual
      if (usuarioActual && usuarioActual.especialidades) {
        this.especialidades = usuarioActual.especialidades; // Llenar el array con las especialidades
        console.log("Especialidades del usuario:", this.especialidades);
      } else {
        console.log("No se encontraron especialidades para el usuario actual.");
        this.especialidades = [];
      }
    } catch (error) {
      console.error("Error al cargar especialidades:", error);
      this.especialidades = [];
    }
  }

  // Validación de horarios permitidos según el día
  validarHorarioPermitido(control: FormControl): { [key: string]: boolean } | null {
    if (!this.disponibilidadForm || !this.disponibilidadForm.get('fechaSeleccionada')) {
      return null;
    }
  
    const fechaSeleccionada = new Date(this.disponibilidadForm.get('fechaSeleccionada')?.value);
    const horario = control.value;
  
    // Convertir la hora y minutos del input a Date
    const [horas, minutos] = horario.split(':').map(Number);
    fechaSeleccionada.setHours(horas, minutos);
  
    const diaSemana = fechaSeleccionada.getDay();
    const esHorarioValido =
      (diaSemana >= 1 && diaSemana <= 5 && horas >= 8 && horas < 19) || // Lunes a viernes
      (diaSemana === 6 && horas >= 8 && horas < 14); // Sábado
  
    return esHorarioValido ? null : { horarioInvalido: true };
  }

  // Generar intervalos de horario en bloques de la duración definida para el turno
  generarIntervalosHorarios() {
    const fechaSeleccionada = new Date(this.disponibilidadForm.get('fechaSeleccionada')?.value);
    const dia = fechaSeleccionada.getDay();
    const esLaborable = dia >= 1 && dia <= 5;
    const esSabado = dia === 6;

    const horaInicio = esLaborable ? 8 : 8;
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
    console.log("user id:", this.userId);
    console.log("Estado de disponibilidadForm:", this.disponibilidadForm.status);
    console.log("Valor de disponibilidadForm:", this.disponibilidadForm.value);
  
    if (this.disponibilidadForm.invalid || !this.userId) {
      console.log("Formulario inválido o ID de usuario no encontrado.");
      return;
    }
  
    const fechaSeleccionada = this.disponibilidadForm.get('fechaSeleccionada')?.value;
    const horario = this.disponibilidadForm.get('horario')?.value;
    const especialidadSeleccionada = this.disponibilidadForm.get('especialidadSeleccionada')?.value;
  
    if (!fechaSeleccionada || !horario || !especialidadSeleccionada) {
      console.log("Datos incompletos en el formulario.");
      return;
    }
  
    try {
      const userDocRef = doc(this.firestore, 'DatosUsuarios', this.userId);
      const userDoc = await getDoc(userDocRef);
  
      // Obtener disponibilidad actual o inicializar como un array vacío
      let disponibilidadActual = userDoc.exists() && userDoc.data()?.['disponibilidad']
        ? userDoc.data()?.['disponibilidad']
        : [];
  
      // Comprobar si ya existe la combinación de fecha y horario
      const existeHorario = disponibilidadActual.some(
        (disp: any) => disp.fechaSeleccionada === fechaSeleccionada && disp.horarios.includes(horario)
      );
  
      if (existeHorario) {
        alert("Ya existe una disponibilidad para esta fecha y horario.");
        return;
      }
  
      // Actualizar o añadir la disponibilidad según la fecha
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
  
      // Actualizar el documento del usuario en Firestore
      await updateDoc(userDocRef, { disponibilidad: disponibilidadActual });
      this.mostrarSnackbar = true;

      // Ocultar snackbar después de 3 segundos
      setTimeout(() => {
        this.mostrarSnackbar = false;
      }, 3000);
    
      console.log("Disponibilidad guardada exitosamente.");
  
      // Limpiar el campo de horario después de guardar
      this.disponibilidadForm.get('horario')?.reset();
    } catch (error) {
      console.error("Error al guardar la disponibilidad:", error);
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
