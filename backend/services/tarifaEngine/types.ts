/**
 * @module services/tarifaEngine/types
 * @description Tipos e interfaces para el motor de cálculo de tarifas
 */

import { Types } from 'mongoose';
import { FormulaContext, TarifaResult } from '../../utils/formulaParser';

/**
 * Interface para el contexto de cálculo de tarifa
 */
export interface IContextoCalculo {
  // Identificadores principales
  clienteId: Types.ObjectId | string;
  origenId: Types.ObjectId | string;
  destinoId: Types.ObjectId | string;

  // Parámetros de cálculo
  fecha: Date;
  tipoTramo: 'TRMC' | 'TRMI';
  tipoUnidad: string;
  metodoCalculo?: string;

  // Cantidades
  palets?: number;
  peso?: number;
  volumen?: number;
  cantidadBultos?: number;

  // Información adicional
  vehiculos?: Array<{ tipo: string; cantidad: number }>;
  urgencia?: 'Normal' | 'Urgente' | 'Critico';
  extras?: Array<{ id: string; cantidad: number }>;

  // Opciones de cálculo
  aplicarReglas?: boolean;
  usarCache?: boolean;
  incluirDesgloseCalculo?: boolean;
}

/**
 * Interface para el resultado detallado del cálculo
 */
export interface IResultadoCalculo extends TarifaResult {
  metodoUtilizado: string;
  formulaAplicada: string;
  reglasAplicadas?: Array<{
    codigo: string;
    nombre: string;
    modificacion: number;
  }>;
  contextoUtilizado?: Partial<FormulaContext>;
  desgloseCalculo?: Array<{
    etapa: string;
    valor: number;
    descripcion: string;
  }>;
  advertencias?: string[];
  cacheUtilizado: boolean;
}

/**
 * Interface para auditoría de cálculo
 */
export interface IAuditoriaCalculo {
  timestamp: Date;
  contexto: IContextoCalculo;
  resultado: IResultadoCalculo;
  tiempoEjecucionMs: number;
  errores?: string[];
}

/**
 * Interface para vehículo con campos específicos
 */
export interface VehiculoDocument {
  capacidadMaxima?: number;
  pesoMaximo?: number;
  tipo: string;
}

/**
 * Interface para regla de tarifa
 */
export interface ReglaTarifaDocument {
  codigo: string;
  nombre: string;
  excluirOtrasReglas?: boolean;
  aplicarModificadores: (valores: Record<string, number>) => Record<string, number>;
}
