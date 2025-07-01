export interface Site {
  _id: string;
  nombre: string;
  direccion?: string;
}

export interface Cliente {
  _id: string;
  nombre: string;
}

export interface Tramo {
  _id: string;
  origen: Site;
  destino: Site;
  cliente: Cliente;
  distancia: number;
  // Campos de la tarifa vigente a nivel raíz (desde el backend)
  tipo?: 'TRMC' | 'TRMI';
  metodoCalculo?: 'Kilometro' | 'Palet' | 'Fijo';
  valor?: number;
  valorPeaje?: number;
  vigenciaDesde?: string;
  vigenciaHasta?: string;
  // Arrays y objetos opcionales
  tarifasHistoricas?: Array<{
    _id: string;
    tipo: 'TRMC' | 'TRMI';
    metodoCalculo: 'Kilometro' | 'Palet' | 'Fijo';
    valor: number;
    valorPeaje: number;
    vigenciaDesde: string;
    vigenciaHasta: string;
  }>;
  tarifaVigente?: {
    tipo: 'TRMC' | 'TRMI';
    metodoCalculo: 'Kilometro' | 'Palet' | 'Fijo';
    valor: number;
    valorPeaje: number;
    vigenciaDesde: string;
    vigenciaHasta: string;
  };
  originalId?: string;
  createdAt?: string;
  updatedAt?: string;
  activo?: boolean;
}