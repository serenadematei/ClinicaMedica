import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
 

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-usuarios.component.html',
  styleUrl: './lista-usuarios.component.css'
})
export class ListaUsuariosComponent implements OnInit{

  usuarios: any[] = [];
  filteredUsuarios: any[] = [];

  selectedClinicalHistories: any[] = [];
  selectedUserName: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  async cargarUsuarios() {
    this.authService.obtenerUsuarios()
      .then(usuarios => {
        this.usuarios = usuarios;
        this.filteredUsuarios = this.usuarios; // Mostramos todos los usuarios por defecto
      })
      .catch(error => {
        console.error('Error al cargar usuarios:', error);
      });
  }
 

  filterUsers(role: string) {
    if (role === 'all') {
      this.filteredUsuarios = this.usuarios;
    } else {
      this.filteredUsuarios = this.usuarios.filter(user => user.role === role);
    }
  }

  aprobarUsuario(userId: string) {
    this.authService.aprobarUsuario(userId)
      .then(() => {
        Swal.fire('Usuario habilitado', 'El usuario ha sido habilitado correctamente.', 'success');
        this.cargarUsuarios();
      })
      .catch(error => {
        Swal.fire('Error', 'No se pudo habilitar el usuario.', 'error');
        console.error('Error al aprobar usuario:', error);
      });
  }

  inhabilitarUsuario(userId: string) {
    this.authService.inhabilitarUsuario(userId)
      .then(() => {
        Swal.fire('Usuario inhabilitado', 'El usuario ha sido inhabilitado correctamente.', 'success');
        this.cargarUsuarios();
      })
      .catch(error => {
        Swal.fire('Error', 'No se pudo inhabilitar el usuario.', 'error');
        console.error('Error al inhabilitar usuario:', error);
      });
  }


    verHistoriaClinica(user: any): void {
      this.authService.obtenerHistoriasClinicasPorPaciente(user.mail).then((historias) => {
        if (historias && historias.length > 0) {
          this.openHistoryModal(historias); // Pasamos todas las historias
        } else {
          Swal.fire('Sin historial', 'Este paciente no tiene historias clínicas registradas.', 'info');
        }
      }).catch(error => {
        console.error('Error al obtener la historia clínica:', error);
      });
    }



    openHistoryModal(historias: any[]) {
   
      const contenidoHtml = historias.map((historia, index) => {
        const datosDinamicos = historia.datosDinamicos
          .map((dato: { clave: string; valor: string }) => `• ${dato.clave}: ${dato.valor}`)
          .join('<br>');
    
        return `
          <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 8px;">
            <h5>Historia Clínica #${index + 1}</h5>
            <p><strong>Fecha de Atención:</strong> ${historia.fecha instanceof Date ? historia.fecha.toLocaleDateString('es-ES') : new Date(historia.fecha.seconds * 1000).toLocaleDateString('es-ES')}</p>
            <p><strong>Altura:</strong> ${historia.altura} cm</p>
            <p><strong>Peso:</strong> ${historia.peso} kg</p>
            <p><strong>Temperatura:</strong> ${historia.temperatura} °C</p>
            <p><strong>Presión:</strong> ${historia.presion}</p>
            <h6>Datos Adicionales</h6>
            <p>${datosDinamicos}</p>
          </div>
        `;
      }).join('');

      Swal.fire({
        title: `<strong>Historias Clínicas del Paciente</strong>`,
        html: `<div style="max-height: 400px; overflow-y: auto;">${contenidoHtml}</div>`,
        showCloseButton: true,
        focusConfirm: false,
        confirmButtonText: 'Cerrar'
      });
    }

}
  

