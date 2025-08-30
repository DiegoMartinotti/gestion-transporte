// Import mathjs using require to avoid TS module resolution issues
const math = require('mathjs');

export interface VariableValue {
  name: string;
  value: number;
  description?: string;
}

export interface VariableDefinition {
  name: string;
  description: string;
}

export interface FormulaResult {
  resultado: number;
  formula: string;
  variables: VariableValue[];
  error?: string;
  evaluacion: {
    expresion: string;
    pasos?: string[];
    tiempoEjecucion: number;
  };
}

export interface FormulaPersonalizada {
  _id: string;
  cliente: string;
  nombre: string;
  descripcion?: string;
  formula: string;
  variables: string[];
  vigenciaDesde: string;
  vigenciaHasta?: string;
  activa: boolean;
}

/**
 * Variables predefinidas disponibles en el sistema
 */
export const getAvailableVariables = (): VariableDefinition[] => {
  return [
    { name: 'palets', description: 'Cantidad de palets' },
    { name: 'distancia', description: 'Distancia en kilómetros' },
    { name: 'peso', description: 'Peso total en toneladas' },
    { name: 'volumen', description: 'Volumen en metros cúbicos' },
    { name: 'tiempo', description: 'Tiempo estimado en horas' },
    { name: 'combustible', description: 'Costo de combustible' },
    { name: 'peaje', description: 'Costo de peajes' },
    { name: 'tarifaBase', description: 'Tarifa base del tramo' },
    { name: 'multiplicador', description: 'Multiplicador de ajuste' },
  ];
};

/**
 * Procesa una fórmula matemática con las variables proporcionadas
 */
export const processFormulaCalculation = (
  formula: string,
  variables: VariableValue[]
): FormulaResult => {
  const startTime = performance.now();

  try {
    // Crear scope con variables
    const scope: Record<string, number> = {};
    variables.forEach((variable) => {
      scope[variable.name] = variable.value;
    });

    // Evaluar la fórmula
    const resultado = math.evaluate(formula, scope);
    const endTime = performance.now();

    return {
      resultado: Number(resultado),
      formula,
      variables,
      evaluacion: {
        expresion: formula,
        tiempoEjecucion: endTime - startTime,
      },
    };
  } catch (error) {
    const endTime = performance.now();

    return {
      resultado: 0,
      formula,
      variables,
      error: error instanceof Error ? error.message : 'Error en la evaluación',
      evaluacion: {
        expresion: formula,
        tiempoEjecucion: endTime - startTime,
      },
    };
  }
};

/**
 * Formatea un número como moneda argentina
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

/**
 * Inicializa las variables para una fórmula seleccionada
 */
export const initializeFormulaVariables = (
  formula: FormulaPersonalizada | undefined,
  currentVariables: VariableValue[]
): VariableValue[] => {
  if (!formula) return currentVariables;

  return formula.variables.map((varName) => {
    const existing = currentVariables.find((v) => v.name === varName);

    return {
      name: varName,
      value: existing?.value || 0,
    };
  });
};
