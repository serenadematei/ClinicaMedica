import { NgIf } from '@angular/common';
import { Component, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { FormsModule, NgModel } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';


@Component({
  selector: 'app-turnos-solicitados-por-medico',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './turnos-solicitados-por-medico.component.html',
  styleUrl: './turnos-solicitados-por-medico.component.css'
})
export class TurnosSolicitadosPorMedicoComponent implements AfterViewChecked {
  fechaInicio: string = '';
  fechaFin: string = '';
  medicosTurnos: { medico: string; cantidad: number }[] = [];
  chartLabels: string[] = [];
  chartData: number[] = [];
  chartInstance!: Chart;
  loading: boolean = false;
  isChartRendered: boolean = false;

  constructor(private firestore: Firestore, private cdr: ChangeDetectorRef, private router: Router) {
    Chart.register(...registerables);
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
    this.isChartRendered = false;
  
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
            turno.estado === 'pendiente'
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
  
      this.renderChart();
    } catch (error) {
      console.error('Error al filtrar turnos:', error);
    } finally {
      this.loading = false;
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
      type: 'bar',
      data: {
        labels: this.chartLabels,
        datasets: [
          {
            label: 'Turnos solicitados por Médico',
            data: this.chartData,
            backgroundColor: '#36A2EB',
            borderColor: '#004085',
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

  ngAfterViewChecked(): void {
    if (!this.isChartRendered && this.chartLabels.length > 0 && this.chartData.length > 0) {
      this.renderChart();
      this.isChartRendered = true; 
    }
    this.cdr.detectChanges(); 
  }

  descargarPDF(): void {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Turnos Solicitados por Médico', 10, 10);
    doc.text(`Del  ${this.fechaInicio} al ${this.fechaFin}`, 10, 20);

    const rows = this.medicosTurnos.map((item) => [item.medico, item.cantidad.toString()]);

    autoTable(doc, {
      head: [['Médico', 'Cantidad']],
      body: rows,
      startY: 30,
    });

    doc.save('turnos_solicitados_por_medico.pdf');
  }

  descargarExcel(): void {
    const ws = XLSX.utils.json_to_sheet(this.medicosTurnos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TurnosPorMedico');
    XLSX.writeFile(wb, 'turnos_solicitados_por_medico.xlsx');
  }

  public goTo(path: string): void {
    this.router.navigate([path]);
  }
}
