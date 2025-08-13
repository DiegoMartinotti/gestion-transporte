import { BaseFilters } from './index';

// Variable definition interface
export interface IVariableDefinition {
  nombre: string;
  descripcion: string;
  tipo: 'number' | 'string' | 'boolean' | 'date';
  origen: 'tramo' | 'viaje' | 'cliente' | 'vehiculo' | 'calculado' | 'constante';
  campo?: string;
  valorPorDefecto?: any;
  requerido: boolean;
}

// Tariff method interface
export interface ITarifaMetodo {
  _id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  formulaBase: string;
  variables: IVariableDefinition[];
  activo: boolean;
  prioridad: number;
  requiereDistancia: boolean;
  requierePalets: boolean;
  permiteFormulasPersonalizadas: boolean;
  configuracion: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Condition interface for business rules
export interface ICondicion {
  campo: string;
  operador:
    | 'igual'
    | 'diferente'
    | 'mayor'
    | 'menor'
    | 'mayorIgual'
    | 'menorIgual'
    | 'entre'
    | 'en'
    | 'contiene';
  valor: any;
  valorHasta?: any;
}

// Tariff modifier interface
export interface IModificador {
  tipo: 'porcentaje' | 'fijo' | 'formula';
  valor: number | string;
  aplicarA: 'tarifa' | 'peaje' | 'total' | 'extras';
  descripcion?: string;
}

// Business rule interface
export interface IReglaTarifa {
  _id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  cliente?: string;
  metodoCalculo?: string;
  condiciones: ICondicion[];
  operadorLogico: 'AND' | 'OR';
  modificadores: IModificador[];
  prioridad: number;
  activa: boolean;
  fechaInicioVigencia: string;
  fechaFinVigencia?: string;
  aplicarEnCascada: boolean;
  excluirOtrasReglas: boolean;
  diasSemana?: number[];
  horariosAplicacion?: {
    horaInicio: string;
    horaFin: string;
  };
  temporadas?: {
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
  }[];
  estadisticas: {
    vecesAplicada: number;
    ultimaAplicacion?: string;
    montoTotalModificado: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Simulation scenario interface
export interface IEscenarioSimulacion {
  nombre: string;
  contexto: {
    cliente?: string;
    tramo?: string;
    distancia?: number;
    palets?: number;
    fecha?: string;
    vehiculo?: string;
    [key: string]: any;
  };
  valoresBase: {
    tarifa: number;
    peaje: number;
    extras: number;
  };
}

// Simulation result interface
export interface IResultadoSimulacion {
  escenario: string;
  valoresOriginales: {
    tarifa: number;
    peaje: number;
    extras: number;
    total: number;
  };
  valoresFinales: {
    tarifa: number;
    peaje: number;
    extras: number;
    total: number;
  };
  reglasAplicadas: {
    codigo: string;
    nombre: string;
    modificacion: number;
  }[];
  diferencia: {
    tarifa: number;
    peaje: number;
    extras: number;
    total: number;
    porcentaje: number;
  };
}

// Audit entry interface
export interface IEntradaAuditoria {
  _id: string;
  fecha: string;
  cliente: string;
  tramo: string;
  viaje?: string;
  metodoCalculo: string;
  contexto: Record<string, any>;
  valoresEntrada: Record<string, number>;
  valoresSalida: Record<string, number>;
  reglasAplicadas: string[];
  tiempoCalculo: number;
  errores?: string[];
  formula?: string;
  variables?: Record<string, any>;
  createdAt: string;
}

// Formula validation result
export interface IValidacionFormula {
  valida: boolean;
  errores: string[];
  advertencias: string[];
  variablesUsadas: string[];
  funcionesUsadas: string[];
}

// Filter interfaces
export interface TarifaMetodoFilters extends BaseFilters {
  activo?: boolean;
  requiereDistancia?: boolean;
  requierePalets?: boolean;
}

export interface ReglaTarifaFilters extends BaseFilters {
  cliente?: string;
  metodoCalculo?: string;
  activa?: boolean;
  vigente?: boolean;
}

export interface AuditoriaFilters extends BaseFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  cliente?: string;
  metodoCalculo?: string;
  conErrores?: boolean;
}

// Form data interfaces
export interface TarifaMetodoFormData {
  codigo: string;
  nombre: string;
  descripcion: string;
  formulaBase: string;
  variables: IVariableDefinition[];
  activo: boolean;
  prioridad: number;
  requiereDistancia: boolean;
  requierePalets: boolean;
  permiteFormulasPersonalizadas: boolean;
  configuracion: Record<string, any>;
}

export interface ReglaTarifaFormData {
  codigo: string;
  nombre: string;
  descripcion: string;
  cliente?: string;
  metodoCalculo?: string;
  condiciones: ICondicion[];
  operadorLogico: 'AND' | 'OR';
  modificadores: IModificador[];
  prioridad: number;
  activa: boolean;
  fechaInicioVigencia: string;
  fechaFinVigencia?: string;
  aplicarEnCascada: boolean;
  excluirOtrasReglas: boolean;
  diasSemana?: number[];
  horariosAplicacion?: {
    horaInicio: string;
    horaFin: string;
  };
  temporadas?: {
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
  }[];
}

// Constants for dropdowns and configurations
export const TIPOS_VARIABLE = [
  { value: 'number', label: 'Número' },
  { value: 'string', label: 'Texto' },
  { value: 'boolean', label: 'Verdadero/Falso' },
  { value: 'date', label: 'Fecha' },
] as const;

export const ORIGENES_VARIABLE = [
  { value: 'tramo', label: 'Tramo' },
  { value: 'viaje', label: 'Viaje' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'vehiculo', label: 'Vehículo' },
  { value: 'calculado', label: 'Calculado' },
  { value: 'constante', label: 'Constante' },
] as const;

export const OPERADORES_CONDICION = [
  { value: 'igual', label: 'Igual (=)' },
  { value: 'diferente', label: 'Diferente (≠)' },
  { value: 'mayor', label: 'Mayor (>)' },
  { value: 'menor', label: 'Menor (<)' },
  { value: 'mayorIgual', label: 'Mayor o igual (≥)' },
  { value: 'menorIgual', label: 'Menor o igual (≤)' },
  { value: 'entre', label: 'Entre' },
  { value: 'en', label: 'En lista' },
  { value: 'contiene', label: 'Contiene' },
] as const;

export const TIPOS_MODIFICADOR = [
  { value: 'porcentaje', label: 'Porcentaje (%)' },
  { value: 'fijo', label: 'Valor fijo (+/-)' },
  { value: 'formula', label: 'Fórmula personalizada' },
] as const;

export const APLICAR_MODIFICADOR_A = [
  { value: 'tarifa', label: 'Tarifa base' },
  { value: 'peaje', label: 'Peajes' },
  { value: 'extras', label: 'Extras' },
  { value: 'total', label: 'Total' },
] as const;

export const FUNCIONES_FORMULA = [
  {
    nombre: 'SI',
    descripcion: 'Función condicional',
    sintaxis: 'SI(condicion, valorSi, valorNo)',
    ejemplo: 'SI(Distancia > 100, Valor * 1.1, Valor)',
  },
  {
    nombre: 'MAX',
    descripcion: 'Valor máximo',
    sintaxis: 'MAX(valor1, valor2, ...)',
    ejemplo: 'MAX(Valor, ValorMinimo)',
  },
  {
    nombre: 'MIN',
    descripcion: 'Valor mínimo',
    sintaxis: 'MIN(valor1, valor2, ...)',
    ejemplo: 'MIN(Valor, ValorMaximo)',
  },
  {
    nombre: 'REDONDEAR',
    descripcion: 'Redondear número',
    sintaxis: 'REDONDEAR(valor, decimales)',
    ejemplo: 'REDONDEAR(Valor * 1.21, 2)',
  },
  {
    nombre: 'ABS',
    descripcion: 'Valor absoluto',
    sintaxis: 'ABS(valor)',
    ejemplo: 'ABS(Diferencia)',
  },
  {
    nombre: 'PROMEDIO',
    descripcion: 'Promedio de valores',
    sintaxis: 'PROMEDIO(valor1, valor2, ...)',
    ejemplo: 'PROMEDIO(Valor1, Valor2, Valor3)',
  },
] as const;
