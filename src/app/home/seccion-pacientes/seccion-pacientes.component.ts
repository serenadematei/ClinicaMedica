import { Component, OnInit } from '@angular/core';
import { TurnosService } from '../../services/turnos.service';
import { HistoriaClinica } from '../../interfaces/historiaClinica';
import { AuthService } from '../../services/auth.service';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Timestamp } from 'firebase/firestore';
import { Router } from '@angular/router';

interface PacienteConTurnos {
  paciente: {
    email: string;
    nombre: string;
    apellido: string;
    dni: string;
    imagenPerfil: string | null;
  };
  historias: HistoriaClinica[];
}

@Component({
  selector: 'app-seccion-pacientes',
  standalone: true,
  imports: [NgFor, NgIf, CommonModule],
  templateUrl: './seccion-pacientes.component.html',
  styleUrl: './seccion-pacientes.component.css'
})
export class SeccionPacientesComponent implements OnInit {

  //pacientesConTurnos: { paciente: string; historias: HistoriaClinica[] }[] = [];
  pacientesConTurnos: PacienteConTurnos[] = [];
  mostrarHistoriaClinica: boolean = false; // Controla la visibilidad del detalle
  historiaSeleccionada: HistoriaClinica | null = null; // Almacena la historia seleccionada

  constructor(private turnosService: TurnosService, private authService: AuthService, private router:Router) {}

  /*ngOnInit(): void {
    this.authService.getCurrentUser().subscribe(user => {
      const especialistaEmail = user?.email || '';
      if (especialistaEmail) {
        this.turnosService.obtenerPacientesConHistoriasClinicas(especialistaEmail).then(historias => {
          // Agrupar historias por paciente
          const agrupadas = historias.reduce((acc, historia) => {
            const pacienteEmail = historia.pacienteEmail;
            const fecha = historia.fecha instanceof Timestamp ? historia.fecha.toDate() : historia.fecha;

            if (!acc[pacienteEmail]) {
              acc[pacienteEmail] = [];
            }

            acc[pacienteEmail].push({
              ...historia,
              fecha
            });

            return acc;
          }, {} as { [key: string]: HistoriaClinica[] });

          // Ordenar y obtener los últimos 3 turnos
          this.pacientesConTurnos = Object.keys(agrupadas).map(pacienteEmail => {
            const historiasOrdenadas = agrupadas[pacienteEmail].sort(
              (a, b) => b.fecha.getTime() - a.fecha.getTime()
            );

            return {
              paciente: pacienteEmail,
              historias: historiasOrdenadas.slice(0, 3) // Últimos 3 turnos
            };
          });
        });
      }
    });
  }*/

    ngOnInit(): void {
      this.authService.getCurrentUser().subscribe(user => {
        const especialistaEmail = user?.email || '';
        if (especialistaEmail) {
          this.turnosService.obtenerPacientesConHistoriasClinicas(especialistaEmail).then(async historias => {
            const agrupadas = historias.reduce((acc, historia) => {
              const pacienteEmail = historia.pacienteEmail;
              const fecha = historia.fecha instanceof Timestamp ? historia.fecha.toDate() : historia.fecha;
  
              if (!acc[pacienteEmail]) {
                acc[pacienteEmail] = [];
              }
  
              acc[pacienteEmail].push({
                ...historia,
                fecha
              });
  
              return acc;
            }, {} as { [key: string]: HistoriaClinica[] });
  
            const pacientesConInfo = await Promise.all(Object.keys(agrupadas).map(async pacienteEmail => {
              const pacienteData = await this.authService.obtenerDatosUsuarioPorEmail(pacienteEmail);
              const historiasOrdenadas = agrupadas[pacienteEmail].sort(
                (a, b) => b.fecha.getTime() - a.fecha.getTime()
              );
  
              return {
                paciente: {
                  email: pacienteEmail,
                  nombre: pacienteData?.nombre || 'N/A',
                  dni: pacienteData?.dni || 'N/A',
                  apellido:pacienteData?.apellido,
                  imagenPerfil: pacienteData?.imagenPerfil1 || null
                },
                historias: historiasOrdenadas.slice(0, 3)
              };
            }));
  
            this.pacientesConTurnos = pacientesConInfo;
          });
        }
      });
    }



  visualizarHistoria(historia: HistoriaClinica): void {
    if (this.historiaSeleccionada === historia && this.mostrarHistoriaClinica) {
      // Si se hace clic en la misma historia seleccionada, alternar visibilidad
      this.mostrarHistoriaClinica = false;
      this.historiaSeleccionada = null;
    } else {
      // Mostrar la nueva historia seleccionada
      this.historiaSeleccionada = historia;
      this.mostrarHistoriaClinica = true;
    }
  }
  

  get tieneDatosDinamicos(): boolean {
    return (
      this.historiaSeleccionada?.datosDinamicos !== undefined &&
      this.historiaSeleccionada.datosDinamicos.length > 0
    );
  }

  public goTo(path: string): void {
    this.router.navigate([path]);
  }

}




