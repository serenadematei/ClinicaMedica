export interface HistoriaClinica {
    pacienteEmail: string;
    especialistaEmail: string;
    fecha: Date;
    altura: number;
    peso: number;
    temperatura: number;
    presion: string;
    datosDinamicos?: Array<{ clave: string; valor: string }>;
  }