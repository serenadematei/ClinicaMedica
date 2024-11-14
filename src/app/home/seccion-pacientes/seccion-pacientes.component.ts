import { Component, OnInit } from '@angular/core';
import { TurnosService } from '../../services/turnos.service';
import { HistoriaClinica } from '../../interfaces/historiaClinica';
import { AuthService } from '../../services/auth.service';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Timestamp } from 'firebase/firestore';


@Component({
  selector: 'app-seccion-pacientes',
  standalone: true,
  imports: [NgFor, NgIf, CommonModule],
  templateUrl: './seccion-pacientes.component.html',
  styleUrl: './seccion-pacientes.component.css'
})
export class SeccionPacientesComponent implements OnInit {
  historiasClinicas: HistoriaClinica[] = [];

  constructor(private turnosService: TurnosService, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe(user => {
      const especialistaEmail = user?.email || '';
      if (especialistaEmail) {
        this.turnosService.obtenerPacientesConHistoriasClinicas(especialistaEmail).then(historias => {
         
          this.historiasClinicas = historias.map(historia => ({
            ...historia,
            fecha: historia.fecha instanceof Timestamp ? historia.fecha.toDate() : historia.fecha,
            datosDinamicos: Array.isArray(historia.datosDinamicos) ? historia.datosDinamicos : [] 
          }));
        });
      }
    });
  }
}
