import { Request, Response } from 'express';
import TarifaMetodo from '../../models/TarifaMetodo';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { body, param, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { validarFormula } from '../../utils/formulaParser';

// Validators
export const validateFormulaValidators = [
  param('id')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('ID de fórmula no válido');
      }
      return true;
    }),
  body('formula').notEmpty().withMessage('La fórmula es requerida').trim(),
  body('metodoCalculo').notEmpty().withMessage('El método de cálculo es requerido').trim(),
  body('variables').optional().isObject().withMessage('Las variables deben ser un objeto'),
  body('contextoTesting')
    .optional()
    .isObject()
    .withMessage('El contexto de testing debe ser un objeto'),
];

// Función auxiliar para validar método de cálculo
const validateMetodoCalculo = async (
  metodoCalculo: string
): Promise<{
  success: boolean;
  metodo?: unknown;
  error?: string;
}> => {
  const metodo = await TarifaMetodo.findByCodigoActivo(metodoCalculo);
  if (!metodo) {
    return {
      success: false,
      error: `Método de cálculo '${metodoCalculo}' no encontrado o inactivo`,
    };
  }
  return { success: true, metodo };
};

// Función auxiliar para ejecutar todas las validaciones
const executeValidations = async (
  formula: string,
  metodo: {
    obtenerVariablesDisponibles: () => {
      nombre: string;
      descripcion: string;
      tipo: string;
      requerido: boolean;
      valorPorDefecto?: unknown;
    }[];
  },
  variables: Record<string, unknown>,
  contextoTesting: Record<string, unknown>
) => {
  const variablesDisponibles = metodo.obtenerVariablesDisponibles();
  const variablesMap = new Map(
    variablesDisponibles.map((v) => [v.nombre, { requerido: v.requerido, tipo: v.tipo }])
  );

  const analisisFormula = analizarFormula(formula);
  const validacionSintaxis = await validarSintaxis(formula);
  const validacionVariables = validarVariablesUtilizadas(
    analisisFormula.variablesEncontradas,
    variablesMap
  );

  const contextoPrueba = prepararContextoPrueba(variablesDisponibles, variables, contextoTesting);
  const resultadoPrueba = await ejecutarPruebaCalculo(formula, contextoPrueba);
  const analisisComplejidad = analizarComplejidad(formula);
  const sugerencias = generarSugerencias(formula, analisisFormula);

  return {
    validacionSintaxis,
    validacionVariables,
    resultadoPrueba,
    analisisFormula,
    analisisComplejidad,
    sugerencias,
    contextoPrueba,
    variablesDisponibles,
  };
};

// Función auxiliar para construir resultado final
const buildValidationResult = (
  validations: {
    validacionSintaxis: { valida: boolean; errores: string[]; advertencias: string[] };
    validacionVariables: {
      valida: boolean;
      errores: string[];
      advertencias: string[];
      variablesRequeridas: string[];
      variablesOpcionales: string[];
      variablesNoEncontradas: string[];
    };
    resultadoPrueba: {
      exitosa: boolean;
      resultado?: number;
      error?: string;
      tiempoEjecucion?: number;
    };
    analisisFormula: {
      longitud: number;
      variablesEncontradas: string[];
      funcionesUtilizadas: string[];
      operadoresUtilizados: string[];
      tieneParentesis: boolean;
      tieneCondicionales: boolean;
    };
    analisisComplejidad: { nivel: string; puntuacion: number; factores: string[] };
    sugerencias: string[];
    contextoPrueba: Record<string, unknown>;
    variablesDisponibles: {
      nombre: string;
      descripcion: string;
      tipo: string;
      requerido: boolean;
    }[];
  },
  metodo: { codigo: string; nombre: string }
) => ({
  valida:
    validations.validacionSintaxis.valida &&
    validations.validacionVariables.valida &&
    validations.resultadoPrueba.exitosa,
  detalles: {
    sintaxis: validations.validacionSintaxis,
    variables: validations.validacionVariables,
    prueba: validations.resultadoPrueba,
    analisis: {
      longitud: validations.analisisFormula.longitud,
      variablesEncontradas: validations.analisisFormula.variablesEncontradas,
      funcionesUtilizadas: validations.analisisFormula.funcionesUtilizadas,
      operadoresUtilizados: validations.analisisFormula.operadoresUtilizados,
      tieneParentesis: validations.analisisFormula.tieneParentesis,
      tieneCondicionales: validations.analisisFormula.tieneCondicionales,
      complejidad: validations.analisisComplejidad,
    },
    metodo: {
      codigo: metodo.codigo,
      nombre: metodo.nombre,
      variablesDisponibles: validations.variablesDisponibles.map((v) => ({
        nombre: v.nombre,
        descripcion: v.descripcion,
        tipo: v.tipo,
        requerido: v.requerido,
      })),
    },
    sugerencias: validations.sugerencias,
    contextoPrueba: validations.contextoPrueba,
  },
  timestamp: new Date(),
});

export const validateFormula = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Datos de entrada inválidos', 400, { errors: errors.array() });
      return;
    }

    const { formula, metodoCalculo, variables = {}, contextoTesting = {} } = req.body;

    const metodoValidation = await validateMetodoCalculo(metodoCalculo);
    if (!metodoValidation.success) {
      ApiResponse.error(res, metodoValidation.error!, 404);
      return;
    }

    const validations = await executeValidations(
      formula,
      metodoValidation.metodo as {
        obtenerVariablesDisponibles: () => {
          nombre: string;
          descripcion: string;
          tipo: string;
          requerido: boolean;
          valorPorDefecto?: unknown;
        }[];
      },
      variables,
      contextoTesting
    );
    const resultado = buildValidationResult(
      validations,
      metodoValidation.metodo as { codigo: string; nombre: string }
    );

    logger.debug(`[FormulasCliente] Fórmula validada para método ${metodoCalculo}`, {
      valida: resultado.valida,
      metodo: metodoCalculo,
      variablesUtilizadas: (validations.analisisFormula as { variablesEncontradas: string[] })
        .variablesEncontradas.length,
      usuario: (req as { user?: { email: string } }).user?.email,
    });

    const mensaje = resultado.valida
      ? 'Fórmula validada exitosamente'
      : 'La fórmula contiene errores';
    ApiResponse.success(res, resultado, mensaje);
  } catch (error: unknown) {
    logger.error('[FormulasCliente] Error al validar fórmula:', error);
    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};

function analizarFormula(formula: string): {
  longitud: number;
  variablesEncontradas: string[];
  funcionesUtilizadas: string[];
  operadoresUtilizados: string[];
  tieneParentesis: boolean;
  tieneCondicionales: boolean;
} {
  const variablesEncontradas = Array.from(
    new Set(
      (formula.match(/\b[A-Za-z]\w*\b/g) || []).filter((palabra) => !esFuncionConocida(palabra))
    )
  );
  const funcionesUtilizadas = Array.from(
    new Set(
      (formula.match(/\b[A-Za-z]\w*(?=\s*\()/g) || []).filter((func) => esFuncionConocida(func))
    )
  );
  const operadoresUtilizados = Array.from(new Set(formula.match(/[+\-*/%^<>=!&|]/g) || []));
  return {
    longitud: formula.length,
    variablesEncontradas,
    funcionesUtilizadas,
    operadoresUtilizados,
    tieneParentesis: /[()]/.test(formula),
    tieneCondicionales: /\b(SI|IF)\s*\(/.test(formula),
  };
}

const DEFAULT_ERROR_MESSAGE = 'Error desconocido';
const checkParenthesesBalance = (formula: string): string | null =>
  (formula.match(/\(/g) || []).length - (formula.match(/\)/g) || []).length !== 0
    ? 'Paréntesis desbalanceados'
    : null;
const checkConsecutiveOperators = (formula: string): string | null =>
  /[+\-*/%^]{2,}/.test(formula) ? 'Operadores consecutivos detectados' : null;
const checkDivisionByZero = (formula: string): string | null =>
  /\/\s*0(?!\d)/.test(formula) ? 'Posible división por cero detectada' : null;
const checkFormulaLength = (formula: string): string | null =>
  formula.length > 500 ? 'Fórmula muy larga, considere simplificarla' : null;

async function validarSintaxis(
  formula: string
): Promise<{ valida: boolean; errores: string[]; advertencias: string[] }> {
  const errores: string[] = [],
    advertencias: string[] = [];
  try {
    const resultado = validarFormula(formula);
    if (resultado.valida) {
      const parenthesesError = checkParenthesesBalance(formula);
      if (parenthesesError) errores.push(parenthesesError);
      const operatorsError = checkConsecutiveOperators(formula);
      if (operatorsError) errores.push(operatorsError);
      const divisionWarning = checkDivisionByZero(formula);
      if (divisionWarning) advertencias.push(divisionWarning);
      const lengthWarning = checkFormulaLength(formula);
      if (lengthWarning) advertencias.push(lengthWarning);
    } else errores.push(resultado.mensaje || 'Error de sintaxis en la fórmula');
  } catch (error: unknown) {
    errores.push(
      `Error de validación: ${error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE}`
    );
  }
  return { valida: errores.length === 0, errores, advertencias };
}

function validarVariablesUtilizadas(
  variablesFormula: string[],
  variablesDisponibles: Map<string, { requerido: boolean; tipo: string }>
): {
  valida: boolean;
  errores: string[];
  advertencias: string[];
  variablesRequeridas: string[];
  variablesOpcionales: string[];
  variablesNoEncontradas: string[];
} {
  const errores: string[] = [],
    advertencias: string[] = [],
    variablesRequeridas: string[] = [],
    variablesOpcionales: string[] = [],
    variablesNoEncontradas: string[] = [];
  for (const variable of variablesFormula) {
    const definicion = variablesDisponibles.get(variable);
    if (!definicion) {
      variablesNoEncontradas.push(variable);
      errores.push(`Variable '${variable}' no está definida en el método`);
    } else {
      if (definicion.requerido) variablesRequeridas.push(variable);
      else variablesOpcionales.push(variable);
      if (definicion.tipo === 'string' && !/[+]/.test(variablesFormula.join()))
        advertencias.push(
          `Variable '${variable}' es de tipo texto, asegúrese de usarla correctamente`
        );
    }
  }
  const faltanImportantes = ['Valor', 'Cantidad', 'Palets'].filter(
    (v) => variablesDisponibles.has(v) && !variablesFormula.includes(v)
  );
  if (faltanImportantes.length > 0)
    advertencias.push(`Considere utilizar: ${faltanImportantes.join(', ')}`);
  return {
    valida: errores.length === 0,
    errores,
    advertencias,
    variablesRequeridas,
    variablesOpcionales,
    variablesNoEncontradas,
  };
}

function prepararContextoPrueba(
  variablesDisponibles: { nombre: string; valorPorDefecto?: unknown }[],
  variables: Record<string, unknown>,
  contextoTesting: Record<string, unknown>
): Record<string, unknown> {
  const contexto = {
    Valor: 100,
    Peaje: 10,
    Cantidad: 5,
    Palets: 5,
    Distancia: 50,
    Peso: 1000,
    Volumen: 20,
    DiaSemana: 2,
    Mes: 6,
    ...contextoTesting,
    ...variables,
  };
  variablesDisponibles.forEach((v: { nombre: string; valorPorDefecto?: unknown }) => {
    if (v.valorPorDefecto !== undefined && contexto[v.nombre] === undefined)
      contexto[v.nombre] = v.valorPorDefecto;
  });
  return contexto;
}

async function ejecutarFormulaNumerica(
  formula: string,
  contexto: Record<string, unknown>
): Promise<{ exitosa: boolean; valor?: number; error?: string }> {
  try {
    const { evaluarFormula } = await import('../../utils/formulaParser');
    const contextoCasteado: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(contexto)) {
      contextoCasteado[key] = typeof value === 'number' ? value : String(value);
    }
    const resultado = evaluarFormula(formula, contextoCasteado);
    if (typeof resultado === 'number' && !isNaN(resultado) && isFinite(resultado))
      return { exitosa: true, valor: resultado };
    return { exitosa: false, error: 'El resultado no es un número válido' };
  } catch (error: unknown) {
    return {
      exitosa: false,
      error: error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
    };
  }
}

async function ejecutarPruebaCalculo(
  formula: string,
  contexto: Record<string, unknown>
): Promise<{ exitosa: boolean; resultado?: number; error?: string; tiempoEjecucion?: number }> {
  try {
    const inicio = Date.now();
    const contextoCasteado: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(contexto)) {
      contextoCasteado[key] = typeof value === 'number' ? value : String(value);
    }
    const resultado = validarFormula(formula);
    const tiempoEjecucion = Date.now() - inicio;
    if (resultado.valida) {
      const evaluacionNumerica = await ejecutarFormulaNumerica(formula, contexto);
      if (evaluacionNumerica.exitosa)
        return { exitosa: true, resultado: evaluacionNumerica.valor, tiempoEjecucion };
    }
    return { exitosa: false, error: resultado.mensaje || 'Resultado no válido', tiempoEjecucion };
  } catch (error: unknown) {
    return {
      exitosa: false,
      error: error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
    };
  }
}

function analizarComplejidad(formula: string): {
  nivel: string;
  puntuacion: number;
  factores: string[];
} {
  const factores: string[] = [];
  let p = 0;
  if (formula.length > 100) {
    p += 2;
    factores.push('Fórmula larga');
  }
  if ((formula.match(/\(/g) || []).length > 3) {
    p += 3;
    factores.push('Funciones anidadas');
  }
  if (/\b(SI|IF)\s*\(/.test(formula)) {
    p += 2;
    factores.push('Lógica condicional');
  }
  if (Array.from(new Set(formula.match(/\b[A-Za-z]\w*\b/g) || [])).length > 8) {
    p += 2;
    factores.push('Muchas variables');
  }
  let nivel: string;
  if (p <= 2) nivel = 'Baja';
  else if (p <= 5) nivel = 'Media';
  else if (p <= 8) nivel = 'Alta';
  else nivel = 'Muy Alta';
  return { nivel, puntuacion: p, factores };
}

function generarSugerencias(
  formula: string,
  analisis: { variablesEncontradas: string[] }
): string[] {
  const s: string[] = [];
  if (formula.length > 200) s.push('Considere dividir esta fórmula compleja');
  if (!analisis.variablesEncontradas.includes('Valor')) s.push('Incluya la variable "Valor"');
  if (analisis.variablesEncontradas.length > 5) s.push('Documente bien la fórmula');
  if (!formula.includes('MAX') && !formula.includes('MIN')) s.push('Use MAX() o MIN()');
  if (formula.includes('/') && !formula.includes('SI(')) s.push('Valide divisiones por cero');
  return s;
}

function esFuncionConocida(palabra: string): boolean {
  return [
    'SI',
    'IF',
    'MAX',
    'MIN',
    'REDONDEAR',
    'ABS',
    'PROMEDIO',
    'SUMA',
    'PRODUCTO',
    'POTENCIA',
    'RAIZ',
    'LOG',
    'EXP',
    'SIN',
    'COS',
    'TAN',
    'FLOOR',
    'CEIL',
    'ROUND',
  ].includes(palabra.toUpperCase());
}
