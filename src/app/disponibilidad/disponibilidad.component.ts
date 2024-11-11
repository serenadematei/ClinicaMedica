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

        // Verificar las imágenes cargadas
        console.log("Imagen perfil 1 del paciente:", this.usuarioActual.imagenPerfil1);
        console.log("Imagen perfil 2 del paciente:", this.usuarioActual.imagenPerfil2);
        console.log("Imagen perfil del especialista:", this.usuarioActual.imagenPerfil);
        console.log("Imagen perfil del admin:", this.usuarioActual.imagenPerfil);
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
      if (fecha.getDay() !== 0) { // Excluir domingos
        this.proximosDias.push({ dia: `${dias[fecha.getDay() - 1]} ${fecha.toLocaleDateString()}`, fecha });
      }
    }
  }

  // Generar intervalos de horario en bloques de duración definida para el turno
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
 