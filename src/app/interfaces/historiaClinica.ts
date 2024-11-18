export interface HistoriaClinica {
    pacienteEmail: string;
    especialistaEmail: string;
    fecha: Date;
    altura: number;
    peso: number;
    temperatura: number;
    presion: string;
    datosDinamicos?: Array<{ clave: string; valor: string }>;

    paciente?: {
      nombre?: string;
      apellido?: string;
      edad?: number;
      [key: string]: any; // Para permitir más propiedades si es necesario
    };
  }