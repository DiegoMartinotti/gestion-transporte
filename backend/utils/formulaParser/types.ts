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
  Palets?: number | undefined;

  // Variables de distancia y ubicación
  Distancia?: number | undefined;
  DistanciaReal?: number | undefined;
  DistanciaAerea?: number | undefined;

  // Variables de tiempo
  Fecha?: Date | undefined;
  DiaSemana?: number | undefined;
  Mes?: number | undefined;
  Trimestre?: number | undefined;
  EsFinDeSemana?: boolean | undefined;
  EsFeriado?: boolean | undefined;
  HoraDelDia?: number | undefined;

  // Variables del vehículo
  TipoUnidad?: string | undefined;
  CapacidadMaxima?: number | undefined;
  PesoMaximo?: number | undefined;
  CantidadVehiculos?: number | undefined;

  // Variables del cliente
  TipoCliente?: string | undefined;
  CategoriaCliente?: string | undefined;
  DescuentoCliente?: number | undefined;

  // Variables adicionales
  Peso?: number | undefined;
  Volumen?: number | undefined;
  CantidadBultos?: number | undefined;
  TipoCarga?: string | undefined;
  Urgencia?: string | undefined;

  // Variables personalizadas
  [key: string]: FormulaValueType | undefined;
}

/**
 * Interface para el resultado del cálculo de tarifa
 */
export interface TarifaResult {
  tarifaBase: number;
  peaje: number;
  total: number;
}
