import { AfterViewInit, Component, NgModule } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Chart, ChartType, registerables } from 'chart.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';


@Component({
  selector: 'app-turnos-finalizados-por-medico',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './turnos-finalizados-por-medico.component.html',
  styleUrl: './turnos-finalizados-por-medico.component.css'
})
export class TurnosFinalizadosPorMedicoComponent  implements AfterViewInit {
  fechaInicio: string = '';
  fechaFin: string = '';
  medicosTurnos: { medico: string; cantidad: number }[] = [];
  chartLabels: string[] = [];
  chartData: number[] = [];
  chartInstance: Chart | null = null;
  loading: boolean = false;

  constructor(private firestore: Firestore, private router:Router) {
    Chart.register(...registerables);
  }

  async ngAfterViewInit(): Promise<void> {
  }

  async filtrarTurnos(): Promise<void> {
    if (!this.fechaInicio || !this.fechaFin) {
      alert('Por favor, selecciona un rango de fechas válido.');
      return;
    }
  
    const inicio = new Date(this.fechaInicio);
    const fin = new Date(this.fechaFin);
    fin.setHours(23, 59, 59);
  
    this.loading = true;
  
    try {
      const turnosRef = collection(this.firestore, 'turnos');
      const snapshot = await getDocs(turnosRef);
  
      const turnos = snapshot.docs
        .map((doc) => doc.data())
        .filter((turno: any) => {
          const fechaTurno =
            turno.fechaHora instanceof Date
              ? turno.fechaHora
              : new Date(turno.fechaHora.seconds * 1000);
  
          return (
            fechaTurno >= inicio &&
            fechaTurno <= fin &&
            turno.estado === 'realizado'
          );
        });
  
      const agrupados = turnos.reduce((acc: { [key: string]: number }, turno: any) => {
        const medico = `${turno.especialista?.nombre || 'N/A'} ${turno.especialista?.apellido || 'N/A'}`;
        acc[medico] = (acc[medico] || 0) + 1;
        return acc;
      }, {});
  
      this.medicosTurnos = Object.entries(agrupados).map(([medico, cantidad]) => ({
        medico,
        cantidad,
      }));
  
      this.chartLabels = this.medicosTurnos.map((item) => item.medico);
      this.chartData = this.medicosTurnos.map((item) => item.cantidad);
    } catch (error) {
      console.error('Error al filtrar turnos:', error);
    } finally {
      this.loading = false;
  
      // Espera a que el canvas exista antes de renderizar el gráfico
      setTimeout(() => {
        this.renderChart();
      }, 0);
    }
  }

  renderChart(): void {
    const canvas = document.getElementById('chartCanvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error('No se encontró el canvas con ID chartCanvas');
      return;
    }

    if (this.chartInstance) {
      this.chartInstance.destroy(); 
    }

    this.chartInstance = new Chart(canvas, {
      type: 'line', 
      data: {
        labels: this.chartLabels,
        datasets: [
          {
            label: 'Turnos Finalizados por Médico',
            data: this.chartData,
            borderColor: '#B33F62',
            backgroundColor: 'rgba(209, 122, 148, 0.9)',
            fill: true,
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
        scales: {
          x: {
            title: {
              display: true,
              text: 'Médicos',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Cantidad de Turnos',
            },
            beginAtZero: true,
          },
        },
      },
    });
  }

  descargarPDF(): void {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Turnos Finalizados por Médico', 10, 10);
    doc.text(`Rango: ${this.fechaInicio} - ${this.fechaFin}`, 10, 20);

    const rows = this.medicosTurnos.map((item) => [item.medico, item.cantidad.toString()]);

    autoTable(doc, {
      head: [['Médico', 'Cantidad']],
      body: rows,
      startY: 30,
    });

    doc.save('turnos_finalizados_por_medico.pdf');
  }

  descargarExcel(): void {
    const ws = XLSX.utils.json_to_sheet(this.medicosTurnos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TurnosFinalizados');
    XLSX.writeFile(wb, 'turnos_finalizados_por_medico.xlsx');
  }

  public goTo(path: string): void {
    this.router.navigate([path]);
  }
}