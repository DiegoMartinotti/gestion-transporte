import { useState, useEffect, useCallback, useMemo } from 'react';

// Tipos base para las calculadoras
export interface CalculationItem {
  id: string;
  concepto: string;
  valor: number;
  formula?: string;
  tipo?: 'FIJO' | 'VARIABLE' | 'PORCENTAJE';
  unidad?: string;
  cantidad?: number;
}

export interface CalculationResult {
  subtotal: number;
  total: number;
  descuentos?: number;
  recargos?: number;
  desglose: CalculationItem[];
  metadatos?: Record<string, unknown>;
}

export interface CalculationConfig {
  // Configuración general
  precision?: number; // Decimales para redondeo
  currency?: string; // Moneda para formateo
  allowNegative?: boolean; // Permitir valores negativos
  autoCalculate?: boolean; // Cálculo automático al cambiar inputs
  // Validaciones
  minValue?: number;
  maxValue?: number;
  // Callbacks
  onCalculate?: (result: CalculationResult) => void;
  onError?: (error: string) => void;
  onValidate?: (items: CalculationItem[]) => boolean;
}

export interface CalculatorBaseState {
  items: CalculationItem[];
  result: CalculationResult;
  loading: boolean;
  error: string | null;
  isValid: boolean;
}

export interface CalculatorBaseActions {
  // Gestión de items
  addItem: (item: Omit<CalculationItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<CalculationItem>) => void;
  clearItems: () => void;
  setItems: (items: CalculationItem[]) => void;
  
  // Cálculos
  calculate: () => void;
  recalculate: () => void;
  reset: () => void;
  
  // Utilidades
  formatValue: (value: number) => string;
  validateItems: () => boolean;
  
  // Estado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Interfaz para parámetros de cálculo
interface CalculationParams {
  items: CalculationItem[];
  validateItems: () => boolean;
  roundValue: (value: number) => number;
  precision: number;
  currency: string;
  onCalculate?: (result: CalculationResult) => void;
  onError?: (error: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Función auxiliar para procesar un item individual
function processCalculationItem(
  item: CalculationItem,
  currentSubtotal: number
): { valorFinal: number; deltaSubtotal: number; deltaRecargos: number; deltaDescuentos: number } {
  let valorFinal = item.valor;
  
  // Aplicar cantidad si existe
  if (item.cantidad !== undefined && item.cantidad !== 0) {
    valorFinal = item.valor * item.cantidad;
  }

  let deltaSubtotal = 0;
  let deltaRecargos = 0;
  let deltaDescuentos = 0;

  // Procesar según tipo
  switch (item.tipo) {
    case 'FIJO':
    case 'VARIABLE':
      deltaSubtotal = valorFinal;
      break;
    case 'PORCENTAJE': {
      const porcentaje = (currentSubtotal * valorFinal) / 100;
      if (valorFinal >= 0) {
        deltaRecargos = porcentaje;
      } else {
        deltaDescuentos = Math.abs(porcentaje);
      }
      break;
    }
    default:
      deltaSubtotal = valorFinal;
  }

  return { valorFinal, deltaSubtotal, deltaRecargos, deltaDescuentos };
}

// Función auxiliar para crear metadatos del resultado
function createResultMetadata(
  itemCount: number,
  precision: number,
  currency: string
): Record<string, unknown> {
  return {
    itemCount,
    calculatedAt: new Date().toISOString(),
    precision,
    currency
  };
}

// Función auxiliar para manejar errores de cálculo
function handleCalculationError(
  error: unknown,
  onError?: (error: string) => void,
  setError?: (error: string | null) => void
): CalculationResult {
  const errorMessage = error instanceof Error ? error.message : 'Error en el cálculo';
  if (setError) setError(errorMessage);
  if (onError) onError(errorMessage);
  
  return {
    subtotal: 0,
    total: 0,
    desglose: [],
    metadatos: { error: errorMessage }
  };
}

// Función principal de cálculo extraída
function performCalculation(params: CalculationParams): CalculationResult {
  const { 
    items, 
    validateItems, 
    roundValue, 
    precision, 
    currency, 
    onCalculate, 
    onError, 
    setLoading, 
    setError 
  } = params;

  try {
    setLoading(true);
    setError(null);

    if (!validateItems()) {
      throw new Error('Items de cálculo inválidos');
    }

    let subtotal = 0;
    let descuentos = 0;
    let recargos = 0;
    const desglose: CalculationItem[] = [];

    // Procesar cada item
    for (const item of items) {
      const { valorFinal, deltaSubtotal, deltaRecargos, deltaDescuentos } = 
        processCalculationItem(item, subtotal);

      subtotal += deltaSubtotal;
      recargos += deltaRecargos;
      descuentos += deltaDescuentos;

      // Agregar al desglose
      desglose.push({
        ...item,
        valor: roundValue(valorFinal)
      });
    }

    // Calcular total
    const total = roundValue(subtotal + recargos - descuentos);

    const result: CalculationResult = {
      subtotal: roundValue(subtotal),
      total,
      descuentos: descuentos > 0 ? roundValue(descuentos) : undefined,
      recargos: recargos > 0 ? roundValue(recargos) : undefined,
      desglose,
      metadatos: createResultMetadata(items.length, precision, currency)
    };

    // Callback de cálculo completado
    if (onCalculate) {
      onCalculate(result);
    }

    return result;
  } catch (err) {
    return handleCalculationError(err, onError, setError);
  } finally {
    setLoading(false);
  }
}

// Funciones auxiliares (sin hooks)
function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function isValidValue(value: number, allowNegative: boolean, minValue: number, maxValue: number): boolean {
  if (!allowNegative && value < 0) return false;
  if (value < minValue || value > maxValue) return false;
  return true;
}


// Hook principal para calculadoras
export function useCalculatorBase(config: CalculationConfig = {}): [CalculatorBaseState, CalculatorBaseActions] {
  const {
    precision = 2,
    currency = 'ARS',
    allowNegative = false,
    autoCalculate = true,
    minValue = 0,
    maxValue = Number.MAX_SAFE_INTEGER,
    onCalculate,
    onError,
    onValidate
  } = config;

  // Estado interno
  const [items, setItemsState] = useState<CalculationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Funciones utilitarias
  const roundValue = useCallback((value: number): number => {
    return Number(value.toFixed(precision));
  }, [precision]);

  const formatValue = useCallback((value: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }).format(value);
  }, [currency, precision]);

  // Función para validar items
  const validateItems = useCallback((): boolean => {
    try {
      for (const item of items) {
        if (!isValidValue(item.valor, allowNegative, minValue, maxValue)) return false;
        if (item.cantidad !== undefined && !isValidValue(item.cantidad, allowNegative, minValue, maxValue)) return false;
      }
      
      if (onValidate && !onValidate(items)) return false;
      return true;
    } catch (err) {
      console.error('Error validating items:', err);
      return false;
    }
  }, [items, allowNegative, minValue, maxValue, onValidate]);

  // Función principal de cálculo
  const calculate = useCallback((): CalculationResult => {
    return performCalculation({
      items,
      validateItems,
      roundValue,
      precision,
      currency,
      onCalculate,
      onError,
      setLoading,
      setError
    });
  }, [items, validateItems, roundValue, precision, currency, onCalculate, onError]);

  // Resultado calculado reactivamente
  const result = useMemo(() => {
    if (autoCalculate && items.length > 0) {
      return calculate();
    }
    return {
      subtotal: 0,
      total: 0,
      desglose: [],
      metadatos: {}
    };
  }, [items, autoCalculate, calculate]);

  const isValid = useMemo(() => error === null && validateItems(), [error, validateItems]);

  // Acciones para gestión de items
  const addItem = useCallback((item: Omit<CalculationItem, 'id'>) => {
    const newItem: CalculationItem = { ...item, id: generateItemId() };
    setItemsState(prev => [...prev, newItem]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItemsState(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<CalculationItem>) => {
    setItemsState(prev => 
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  }, []);

  const clearItems = useCallback(() => {
    setItemsState([]);
    setError(null);
  }, []);

  const setItems = useCallback((newItems: CalculationItem[]) => {
    setItemsState(newItems);
  }, []);

  const reset = useCallback(() => {
    setItemsState([]);
    setError(null);
    setLoading(false);
  }, []);

  const recalculate = useCallback(() => calculate(), [calculate]);

  // Auto-cálculo cuando cambian los items
  useEffect(() => {
    if (autoCalculate && items.length > 0) {
      calculate();
    }
  }, [items, autoCalculate, calculate]);

  return [{ items, result, loading, error, isValid }, {
    addItem, removeItem, updateItem, clearItems, setItems,
    calculate, recalculate, reset, formatValue, validateItems,
    setLoading, setError
  }];
}

// Hook especializado para calculadoras de tarifas
export function useTarifaCalculator(config: CalculationConfig & {
  includeExtras?: boolean;
  includeTaxes?: boolean;
} = {}) {
  const [state, actions] = useCalculatorBase(config);
  
  // Métodos específicos para tarifas
  const addTarifaBase = useCallback((valor: number, concepto = 'Tarifa Base') => {
    actions.addItem({
      concepto,
      valor,
      tipo: 'FIJO'
    });
  }, [actions]);

  const addExtra = useCallback((concepto: string, valor: number, cantidad = 1) => {
    actions.addItem({
      concepto,
      valor,
      cantidad,
      tipo: 'VARIABLE'
    });
  }, [actions]);

  const addDescuento = useCallback((concepto: string, porcentaje: number) => {
    actions.addItem({
      concepto,
      valor: -Math.abs(porcentaje),
      tipo: 'PORCENTAJE'
    });
  }, [actions]);

  const addRecargo = useCallback((concepto: string, porcentaje: number) => {
    actions.addItem({
      concepto,
      valor: Math.abs(porcentaje),
      tipo: 'PORCENTAJE'
    });
  }, [actions]);

  return {
    ...state,
    ...actions,
    addTarifaBase,
    addExtra,
    addDescuento,
    addRecargo
  };
}

// Hook especializado para calculadoras de totales
export function useTotalCalculator(config: CalculationConfig & {
  includeIVA?: boolean;
  ivaRate?: number;
} = {}) {
  const { includeIVA = false, ivaRate = 21, ...baseConfig } = config;
  const [state, actions] = useCalculatorBase(baseConfig);

  // Calcular IVA automáticamente
  useEffect(() => {
    if (includeIVA && state.result.subtotal > 0) {
      const hasIVA = state.items.some(item => item.concepto.toLowerCase().includes('iva'));
      if (!hasIVA) {
        actions.addItem({
          concepto: `IVA (${ivaRate}%)`,
          valor: ivaRate,
          tipo: 'PORCENTAJE'
        });
      }
    }
  }, [includeIVA, ivaRate, state.result.subtotal, state.items, actions]);

  return { ...state, ...actions };
}

export default useCalculatorBase;