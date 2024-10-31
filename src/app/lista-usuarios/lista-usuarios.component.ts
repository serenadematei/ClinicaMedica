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
  }
  

