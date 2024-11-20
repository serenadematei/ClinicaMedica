import { NgIf } from '@angular/common';
import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-turnos-por-dia',
  standalone: true,
  imports: [NgIf],
  templateUrl: './turnos-por-dia.component.html',
  styleUrl: './turnos-por-dia.component.css'
})
export class TurnosPorDiaComponent implements AfterViewInit {
  turnosPorDia: { fecha: string; cantidad: number }[] = [];
  chartLabels: string[] = [];
  chartData: number[] = [];
  loading: boolean = true; // Cargar inicialmente
  chartInstance: Chart | null = null;

  constructor(
    private firestore: Firestore,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    Chart.register(...registerables); // Registrar Chart.js manualmente
  }

  async ngAfterViewInit(): Promise<void> {
    this.loading = true;
    await this.cargarTurnosPorDia();
    this.loading = false;

    // Forzar detección de cambios antes de renderizar el gráfico
    this.cdr.detectChanges();

    // Renderizar el gráfico en un setTimeout
    setTimeout(() => this.renderChart(), 0);
  }

  async cargarTurnosPorDia(): Promise<void> {
    try {
      const turnosRef = collection(this.firestore, 'turnos');
      const snapshot = await getDocs(turnosRef);

      const turnos = snapshot.docs
        .map((doc) => doc.data())
        .filter((turno: any) => turno.estado === 'realizado'); // Filtrar solo los turnos realizados

      const turnosAgrupados = turnos.reduce((acc: { [key: string]: number }, turno: any) => {
        const fecha = turno.fechaHora instanceof Date
          ? turno.fechaHora.toLocaleDateString('es-ES')
          : new Date(turno.fechaHora.seconds * 1000).toLocaleDateString('es-ES');

        acc[fecha] = (acc[fecha] || 0) + 1;
        return acc;
      }, {});

      this.turnosPorDia = Object.entries(turnosAgrupados).map(([fecha, cantidad]) => ({
        fecha,
        cantidad,
      }));

      this.chartLabels = this.turnosPorDia.map((item) => item.fecha);
      this.chartData = this.turnosPorDia.map((item) => item.cantidad);
    } catch (error) {
      console.error('Error al cargar los turnos por día:', error);
    }
  }

  renderChart(): void {
    const canvas = document.getElementById('chartCanvas') as HTMLCanvasElement;

    if (!canvas) {
      console.error('No se encontró el canvas con ID chartCanvas');
      return;
    }

    if (this.chartInstance) {
      this.chartInstance.destroy(); // Destruir el gráfico anterior si existe
    }

    this.chartInstance = new Chart(canvas, {
      type: 'bar', // Tipo de gráfico
      data: {
        labels: this.chartLabels,
        datasets: [
          {
            label: 'Turnos por Día',
            data: this.chartData,
            backgroundColor: '#7880B5',
            borderColor: 'rgba(54, 162, 235, 1)',
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

  descargarPDF(): void {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Cantidad de Turnos por Día', 10, 10);

    const rows = this.turnosPorDia.map((item) => [item.fecha, item.cantidad.toString()]);

    autoTable(doc, {
      head: [['Fecha', 'Cantidad']],
      body: rows,
      startY: 20,
    });

    doc.save('turnos_por_dia.pdf');
  }

  descargarExcel(): void {
    const ws = XLSX.utils.json_to_sheet(this.turnosPorDia);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TurnosPorDia');
    XLSX.writeFile(wb, 'turnos_por_dia.xlsx');
  }

  public goTo(path: string): void {
    this.router.navigate([path]);
  }
}