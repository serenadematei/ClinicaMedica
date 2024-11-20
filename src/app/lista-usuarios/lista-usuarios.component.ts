import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ActiveButtonDirective } from '../directivas/active-button.directive';
 

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [CommonModule, ActiveButtonDirective ],
  templateUrl: './lista-usuarios.component.html',
  styleUrl: './lista-usuarios.component.css'
})
export class ListaUsuariosComponent implements OnInit{

  usuarios: any[] = [];
  filteredUsuarios: any[] = [];

  selectedClinicalHistories: any[] = [];
  selectedUserName: string = '';

  currentFilter: string = 'all'; 

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
    this.currentFilter = role; 
    console.log(`Filtro cambiado a: ${role}`);
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


    exportarUsuariosAExcel(): void {
      // Estructura de datos para el Excel
      const datosExcel = this.usuarios.map(usuario => ({
        Nombre: usuario.nombre || 'N/A',
        Apellido: usuario.apellido || 'N/A',
        Email: usuario.mail || 'N/A',
        Rol: usuario.role || 'N/A',
        Edad: usuario.edad || 'N/A',
        DNI: usuario.dni || 'N/A',
        ObraSocial: usuario.obrasocial || 'N/A',
        Especialidades: usuario.especialidades ? usuario.especialidades.join(', ') : 'N/A',
      }));
  
      // Crear hoja de cálculo
      const hoja = XLSX.utils.json_to_sheet(datosExcel);
  
      // Crear el libro de Excel
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, 'Usuarios');
  
      // Convertir a Blob y descargar
      const archivoExcel = XLSX.write(libro, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([archivoExcel], { type: 'application/octet-stream' }), 'usuarios.xlsx');
    }




    descargarDatosUsuario(user: any): void {
      this.authService.obtenerTurnosPorPaciente(user.mail).then((turnos) => {
        if (turnos && turnos.length > 0) {
          this.generarPDFTurnos(user, turnos); // Descarga como PDF
          // O usar Excel:
          // this.generarExcelTurnos(user, turnos);
        } else {
          Swal.fire('Sin turnos', `El usuario ${user.nombre} no tiene turnos registrados.`, 'info');
        }
      }).catch(error => {
        console.error('Error al obtener turnos:', error);
        Swal.fire('Error', 'No se pudo obtener la información de turnos.', 'error');
      });
    }
    generarPDFTurnos(user: any, turnos: any[]): void {
      const doc = new jsPDF();
      const fecha = new Date().toLocaleDateString();
    
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(40, 116, 166); // Azul oscuro
      doc.text(`Turnos de ${user.nombre} ${user.apellido}`, 10, 10);
    
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0); // Negro
      doc.text(`Generado el: ${fecha}`, 10, 20);
    
      let currentY = 30; // Coordenada Y inicial
      let turnosPorPagina = 0;
    
      // Filtrar solo los turnos con estado "realizado"
      const turnosRealizados = turnos.filter(turno => turno.estado === 'realizado');
    
      if (turnosRealizados.length === 0) {
        Swal.fire('Sin turnos', `El usuario ${user.nombre} no tiene turnos con estado "realizado".`, 'info');
        return;
      }
    
      turnosRealizados.forEach((turno, index) => {
        if (turnosPorPagina === 3) {
          doc.addPage();
          currentY = 20;
          turnosPorPagina = 0;
        }
    
        // Línea separadora
        doc.setDrawColor(40, 116, 166); // Azul oscuro
        doc.setLineWidth(0.5);
        doc.line(10, currentY, 200, currentY);
        currentY += 5;
    
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(40, 116, 166); // Azul oscuro
        doc.text(`Turno #${index + 1}`, 10, currentY);
        currentY += 10;
    
        
        const especialidad = turno.especialidad || 'N/A';
        const especialista = turno.especialista?.nombre
          ? `${turno.especialista.nombre} ${turno.especialista.apellido}`
          : 'N/A';
        const fechaTurno = turno.fechaFormateada || 'N/A';
    
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`Especialidad:`, 10, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(String(especialidad), 40, currentY);
    
        currentY += 8;
    
        doc.setFont('helvetica', 'bold');
        doc.text(`Especialista:`, 10, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(String(especialista), 40, currentY);
    
        currentY += 8;
    
        doc.setFont('helvetica', 'bold');
        doc.text(`Fecha:`, 10, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(String(fechaTurno), 40, currentY);
    
        currentY += 10;
    
        if (turno.historiaClinica) {
          doc.setFont('helvetica', 'bold');
          doc.text(`Historia Clínica:`, 10, currentY);
          currentY += 6;
    
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          doc.text(`Altura: ${turno.historiaClinica.altura || 'N/A'} cm`, 20, currentY);
          currentY += 6;
    
          doc.text(`Peso: ${turno.historiaClinica.peso || 'N/A'} kg`, 20, currentY);
          currentY += 6;
    
          doc.text(`Temperatura: ${turno.historiaClinica.temperatura || 'N/A'} °C`, 20, currentY);
          currentY += 6;
    
          doc.text(`Presión: ${turno.historiaClinica.presion || 'N/A'}`, 20, currentY);
          currentY += 6;
    
          if (turno.historiaClinica.datosDinamicos && turno.historiaClinica.datosDinamicos.length > 0) {
            doc.text(`Datos Adicionales:`, 20, currentY);
            currentY += 6;
    
            turno.historiaClinica.datosDinamicos.forEach((dato: { clave: string; valor: string }) => {
              const clave = dato.clave || 'N/A';
              const valor = dato.valor || 'N/A';
              doc.text(`• ${clave}: ${valor}`, 30, currentY);
              currentY += 5;
            });
          }
        }
    
        currentY += 10;
        turnosPorPagina++;
      });
    
      doc.save(`Turnos_${user.nombre}_${user.apellido}.pdf`);
    }
    
    
}
  

