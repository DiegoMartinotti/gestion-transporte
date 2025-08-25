export interface TarifaHistorica {
  _id: string;
  tipo: 'TRMC' | 'TRMI';
  metodoCalculo: 'Kilometro' | 'Palet' | 'Fijo';
  valor: number;
  valorPeaje: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
}

export interface Tramo {
  _id: string;
  origen: {
    _id: string;
    nombre: string;
    direccion: string;
    location?: {
      coordinates: [number, number];
    };
  };
  destino: {
    _id: string;
    nombre: string;
    direccion: string;
    location?: {
      coordinates: [number, number];
    };
  };
  cliente: {
    _id: string;
    nombre: string;
  };
  distancia: number;
  tarifasHistoricas: TarifaHistorica[];
  tarifaVigente?: TarifaHistorica;
  tarifasVigentes?: TarifaHistorica[];
  createdAt: string;
  updatedAt: string;
}

export interface TramoDetailProps {
  tramo: Tramo;
  onEdit: () => void;
  _onClose: () => void;
}

export interface CalculationParams {
  fecha: string;
  tipo: 'TRMC' | 'TRMI';
  cantidad: number;
  unidades: number;
}

export interface CalculationResult {
  costo: number;
  desglose: {
    valorBase: number;
    peaje: number;
    total: number;
  };
}

export interface TarifaStatus {
  vigente: boolean;
  color: string;
  label: string;
}
