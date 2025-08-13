import { CalculoConfig, TipoCalculo } from '../TipoCalculoSelector';

/**
 * Valida una fórmula matemática personalizada
 * @param formula - Fórmula a validar
 * @returns Objeto con resultado de validación
 */
export const validateFormulaExpression = (
  formula: string
): { valid: boolean; error?: string; variables?: string[] } => {
  if (!formula.trim()) {
    return { valid: false, error: 'La fórmula no puede estar vacía' };
  }

  // Variables válidas permitidas en las fórmulas
  const validVariables = [
    'peso',
    'volumen',
    'distancia',
    'tiempo',
    'cantidadCamiones',
    'tarifaBase',
    'factorTipoCamion',
  ];
  const foundVariables: string[] = [];

  // Buscar variables usadas en la fórmula
  validVariables.forEach((variable) => {
    if (formula.includes(variable)) {
      foundVariables.push(variable);
    }
  });

  // Validar sintaxis básica
  const forbiddenPatterns = [
    /[^a-zA-Z0-9\s+\-*/()?.:><=_]/, // Caracteres no permitidos
    /\b(eval|function|require|import|export)\b/, // Palabras clave prohibidas
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(formula)) {
      return { valid: false, error: 'La fórmula contiene caracteres o palabras no permitidas' };
    }
  }

  return { valid: true, variables: foundVariables };
};

/**
 * Obtiene la configuración por defecto según el tipo de cálculo
 * @param tipo - Tipo de cálculo seleccionado
 * @returns Configuración por defecto
 */
export const getDefaultConfigByType = (tipo: TipoCalculo): CalculoConfig => {
  const baseConfig: CalculoConfig = {
    tipo,
    parametros: {
      factorMultiplicador: 1,
      valorMinimo: 0,
      redondeo: 'pesos',
      aplicarIVA: false,
      porcentajeIVA: 21,
    },
  };

  switch (tipo) {
    case 'peso':
      return {
        ...baseConfig,
        parametros: {
          ...baseConfig.parametros,
          factorMultiplicador: 150, // $150 por tonelada
        },
      };
    case 'volumen':
      return {
        ...baseConfig,
        parametros: {
          ...baseConfig.parametros,
          factorMultiplicador: 100, // $100 por m³
        },
      };
    case 'distancia':
      return {
        ...baseConfig,
        parametros: {
          ...baseConfig.parametros,
          factorMultiplicador: 2.5, // $2.5 por km
        },
      };
    case 'tiempo':
      return {
        ...baseConfig,
        parametros: {
          ...baseConfig.parametros,
          factorMultiplicador: 80, // $80 por hora
        },
      };
    case 'fija':
      return {
        ...baseConfig,
        parametros: {
          ...baseConfig.parametros,
          montoFijo: 1000, // $1000 fijo
        },
      };
    case 'formula':
      return {
        ...baseConfig,
        parametros: {
          ...baseConfig.parametros,
          formula: '',
          variables: [],
        },
      };
    default:
      return baseConfig;
  }
};

/**
 * Transforma los datos de configuración para el envío al backend
 * @param config - Configuración actual
 * @returns Configuración transformada
 */
export const transformConfigForSubmit = (config: CalculoConfig): CalculoConfig => {
  const transformed = { ...config };

  // Limpiar valores undefined o null
  if (transformed.parametros) {
    Object.keys(transformed.parametros).forEach((key) => {
      const value = (transformed.parametros as Record<string, unknown>)[key];
      if (value === undefined || value === null || value === '') {
        delete (transformed.parametros as Record<string, unknown>)[key];
      }
    });
  }

  return transformed;
};

/**
 * Genera una fórmula de ejemplo según el tipo
 * @param tipo - Tipo de cálculo
 * @returns Fórmula de ejemplo
 */
export const getExampleFormula = (tipo: TipoCalculo): string => {
  switch (tipo) {
    case 'peso':
      return 'peso * 150 + (peso > 10 ? 500 : 0)';
    case 'volumen':
      return 'volumen * 100 + distancia * 1.5';
    case 'distancia':
      return 'distancia * 2.5 + (cantidadCamiones > 1 ? distancia * 0.5 : 0)';
    case 'tiempo':
      return 'tiempo * 80 + (tiempo > 8 ? (tiempo - 8) * 120 : 0)';
    case 'formula':
      return 'peso * 150 + distancia * 2.5 + (cantidadCamiones - 1) * 300';
    default:
      return '';
  }
};
