import { NgFor, NgIf } from '@angular/common';
import { Component, AfterViewInit, ChangeDetectorRef} from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { ChartConfiguration, ChartType } from 'chart.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Chart, registerables } from 'chart.js';
import { Router } from '@angular/router';


@Component({
  selector: 'app-turnos-por-especialidad',
  standalone: true,
  imports: [NgIf],
  templateUrl: './turnos-por-especialidad.component.html',
  styleUrl: './turnos-por-especialidad.component.css'
})
export class TurnosPorEspecialidadComponent  implements AfterViewInit {

  turnosPorEspecialidad: { especialidad: string; cantidad: number }[] = [];
  chartLabels: string[] = [];
  chartData: number[] = [];
  loading: boolean = true;

  constructor(
    private firestore: Firestore,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    Chart.register(...registerables); // Registro de Chart.js
  }

  async ngAfterViewInit(): Promise<void> {
    await this.cargarTurnosPorEspecialidad();
    this.loading = false;

    // Forzar detección de cambios
    this.cdr.detectChanges();

    // Renderizar el gráfico
    this.renderChart();
  }

  async cargarTurnosPorEspecialidad(): Promise<void> {
    try {
      const turnosRef = collection(this.firestore, 'turnos');
      const snapshot = await getDocs(turnosRef);

      const turnos = snapshot.docs.map((doc) => doc.data());
      const especialidades = turnos.reduce((acc: { [key: string]: number }, turno: any) => {
        const especialidad = turno.especialidad || 'Sin Especialidad';
        acc[especialidad] = (acc[especialidad] || 0) + 1;
        return acc;
      }, {});

      this.turnosPorEspecialidad = Object.entries(especialidades).map(([especialidad, cantidad]) => ({
        especialidad,
        cantidad,
      }));

      this.chartLabels = this.turnosPorEspecialidad.map((item) => item.especialidad);
      this.chartData = this.turnosPorEspecialidad.map((item) => item.cantidad);
    } catch (error) {
      console.error('Error al cargar los turnos por especialidad:', error);
    }
  }

  renderChart(): void {
    const canvas = document.getElementById('chartCanvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error('No se encontró el canvas con ID chartCanvas');
      return;
    }

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.chartLabels,
        datasets: [
          {
            label: 'Turnos por Especialidad',
            data: this.chartData,
            backgroundColor: [
              'rgba(75, 192, 192, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)',
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
        },
      },
    });
  }

  public goTo(path: string): void {
    this.router.navigate([path]);
  }
  

  
  descargarPDF(): void {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Cantidad de Turnos por Especialidad', 10, 10);

    const rows = this.turnosPorEspecialidad.map((item) => [
      item.especialidad,
      item.cantidad.toString(),
    ]);

    autoTable(doc, {
      head: [['Especialidad', 'Cantidad']],
      body: rows,
      startY: 20,
    });

    doc.save('turnos_por_especialidad.pdf');
  }

  descargarExcel(): void {
    const ws = XLSX.utils.json_to_sheet(this.turnosPorEspecialidad);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TurnosPorEspecialidad');
    XLSX.writeFile(wb, 'turnos_por_especialidad.xlsx');
  }

 
}