import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Router } from '@angular/router';

@Component({
  selector: 'app-log-ingresos',
  standalone: true,
  imports: [NgIf],
  templateUrl: './log-ingresos.component.html',
  styleUrl: './log-ingresos.component.css',
})
export class LogIngresosComponent implements OnInit {
  logIngresos: any[] = [];
  chartLabels: string[] = [];
  chartData: number[] = [];
  chartInstance: Chart | null = null;
  loading: boolean = false;

  constructor(private firestore: Firestore, private router:Router) {
    Chart.register(...registerables);
  }

  async ngOnInit(): Promise<void> {
    this.loading = true;
    await this.cargarLogIngresos();
    this.generarDatosParaGrafico();

    // Usamos setTimeout para asegurar que el canvas está en el DOM
    setTimeout(() => this.renderChart(), 0);

    this.loading = false;
  }

  async cargarLogIngresos(): Promise<void> {
    try {
      const logRef = collection(this.firestore, 'userLogin');
      const snapshot = await getDocs(logRef);
      this.logIngresos = snapshot.docs.map((doc) => doc.data());
    } catch (error) {
      console.error('Error al cargar el log de ingresos:', error);
    }
  }

  generarDatosParaGrafico(): void {
    const fechas = this.logIngresos.reduce((acc: { [key: string]: number }, log: any) => {
      const fecha = log.Fecha || 'Sin Fecha';
      acc[fecha] = (acc[fecha] || 0) + 1;
      return acc;
    }, {});

    this.chartLabels = Object.keys(fechas);
    this.chartData = Object.values(fechas);
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

    const chartConfig: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: this.chartLabels,
        datasets: [
          {
            label: 'Ingresos por Fecha',
            data: this.chartData,
            fill: false,
            borderColor: '#36A2EB',
            tension: 0.1,
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
    };

    this.chartInstance = new Chart(canvas, chartConfig);
  }

  descargarPDF(): void {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Log de Ingresos al Sistema', 10, 10);
  
    const rows = this.logIngresos.map((log) => [
      log.Usuario || 'N/A',
      log.Role || 'N/A',
      log.Fecha || 'N/A',
      log.Hora || 'N/A',
    ]);
  
    autoTable(doc, {
      head: [['Usuario', 'Rol', 'Fecha', 'Hora']],
      body: rows,
      startY: 20,
    });
  
    doc.save('log_ingresos.pdf');
  }
  
  descargarExcel(): void {
    const formattedData = this.logIngresos.map((log) => ({
      Usuario: log.Usuario || 'N/A',
      Rol: log.Role || 'N/A',
      Fecha: log.Fecha || 'N/A',
      Hora: log.Hora || 'N/A',
    }));
  
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'LogIngresos': worksheet },
      SheetNames: ['LogIngresos'],
    };
    XLSX.writeFile(workbook, 'log_ingresos.xlsx');
  }
  

  public goTo(path: string): void {
    this.router.navigate([path]);
  }

}