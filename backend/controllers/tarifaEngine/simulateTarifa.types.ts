import { Request } from 'express';
import type { IResultadoCalculo } from '../../services/tarifaEngine';

export interface SimulacionConfiguracion {
  compararMetodos?: boolean;
  incluirDesglose?: boolean;
  aplicarReglas?: boolean;
  incluirAnalisis?: boolean;
  usarCache?: boolean;
}

export interface SimulacionEscenario {
  nombre: string;
  clienteId: string;
  origenId: string;
  destinoId: string;
  tipoUnidad: string;
  fecha?: string | Date;
  palets?: number;
  peso?: number;
  volumen?: number;
  cantidadBultos?: number;
  metodoCalculo?: string;
  tipoTramo?: 'TRMC' | 'TRMI';
  vehiculos?: Array<{ tipo: string; cantidad: number }>;
  urgencia?: 'Normal' | 'Urgente' | 'Critico';
  extras?: Array<{ id: string; cantidad: number }>;
}

export interface SimulacionRequestBody {
  escenarios: SimulacionEscenario[];
  configuracion?: SimulacionConfiguracion;
}

export type SimulateTarifaRequest = Request<
  Record<string, string>,
  unknown,
  SimulacionRequestBody
> & {
  user?: { email?: string };
};

export type SimulacionCalculo =
  | IResultadoCalculo
  | {
      error: string;
      metodoUtilizado: string;
      [key: string]: unknown;
    };

export interface SimulacionResultado {
  nombre: string;
  parametros: {
    clienteId: string;
    origenId: string;
    destinoId: string;
    tipoUnidad: string;
    fecha: Date;
    palets?: number;
    peso?: number;
    metodoCalculo?: string;
    volumen?: number;
    cantidadBultos?: number;
  };
  calculos: Record<string, SimulacionCalculo>;
  analisis?: SimulacionAnalisisResultado;
}

export interface SimulacionAnalisis {
  totalMinimo: number;
  totalMaximo: number;
  totalPromedio: number;
  variacion: number;
  metodosExitosos: number;
  metodosConError: number;
}

export type SimulacionAnalisisResultado = SimulacionAnalisis | { error: string };

export interface SimulacionError {
  escenario: string;
  error: string;
  parametros: {
    clienteId: string;
    origenId: string;
    destinoId: string;
  };
}
