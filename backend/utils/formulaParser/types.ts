/**
 * @module utils/formulaParser/types
 * @description Tipos e interfaces para el parser de fórmulas
 */

/**
 * Interface para las variables utilizadas en evaluación de fórmulas
 */
export type FormulaValueType = number | string | boolean | Date;

export interface FormulaVariables {
  [key: string]: FormulaValueType;
}

/**
 * Interface para el contexto completo de evaluación
 */
export interface FormulaContext {
  // Variables básicas
  Valor: number;
  Peaje: number;
  Cantidad: number;
  Palets?: number;

  // Variables de distancia y ubicación
  Distancia?: number;
  DistanciaReal?: number;
  DistanciaAerea?: number;

  // Variables de tiempo
  Fecha?: Date;
  DiaSemana?: number;
  Mes?: number;
  Trimestre?: number;
  EsFinDeSemana?: boolean;
  EsFeriado?: boolean;
  HoraDelDia?: number;

  // Variables del vehículo
  TipoUnidad?: string;
  CapacidadMaxima?: number;
  PesoMaximo?: number;
  CantidadVehiculos?: number;

  // Variables del cliente
  TipoCliente?: string;
  CategoriaCliente?: string;
  DescuentoCliente?: number;

  // Variables adicionales
  Peso?: number;
  Volumen?: number;
  CantidadBultos?: number;
  TipoCarga?: string;
  Urgencia?: string;

  // Variables personalizadas
  [key: string]: FormulaValueType;
}

/**
 * Interface para el resultado del cálculo de tarifa
 */
export interface TarifaResult {
  tarifaBase: number;
  peaje: number;
  total: number;
}
