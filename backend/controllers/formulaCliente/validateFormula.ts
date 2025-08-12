import { Request, Response } from 'express';
import TarifaMetodo from '../../models/TarifaMetodo';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { body, param, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { validarFormula } from '../../utils/formulaParser';

/**
 * Validators para validación de fórmula
 */
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

/**
 * Valida una fórmula contra un método de cálculo específico
 * Endpoint independiente para validación en tiempo real
 */
export const validateFormula = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Datos de entrada inválidos', 400, errors.array());
      return;
    }

    const { formula, metodoCalculo, variables = {}, contextoTesting = {} } = req.body;

    // Obtener información del método de cálculo
    const metodo = await TarifaMetodo.findByCodigoActivo(metodoCalculo);
    if (!metodo) {
      ApiResponse.error(res, `Método de cálculo '${metodoCalculo}' no encontrado o inactivo`, 404);
      return;
    }

    // Obtener variables disponibles del método
    const variablesDisponibles = metodo.obtenerVariablesDisponibles();
    const variablesMap = new Map(variablesDisponibles.map((v) => [v.nombre, v]));

    // Analizar la fórmula
    const analisisFormula = analizarFormula(formula);

    // Validar sintaxis básica
    const validacionSintaxis = await validarSintaxis(formula);

    // Validar variables utilizadas
    const validacionVariables = validarVariablesUtilizadas(
      analisisFormula.variablesEncontradas,
      variablesMap
    );

    // Preparar contexto de prueba
    const contextoPrueba = prepararContextoPrueba(variablesDisponibles, variables, contextoTesting);

    // Ejecutar prueba de cálculo
    const resultadoPrueba = await ejecutarPruebaCalculo(formula, contextoPrueba);

    // Análisis de complejidad
    const analisisComplejidad = analizarComplejidad(formula);

    // Generar sugerencias
    const sugerencias = generarSugerencias(formula, analisisFormula, validacionVariables, metodo);

    const resultado = {
      valida: validacionSintaxis.valida && validacionVariables.valida && resultadoPrueba.exitosa,
      detalles: {
        sintaxis: validacionSintaxis,
        variables: validacionVariables,
        prueba: resultadoPrueba,
        analisis: {
          ...analisisFormula,
          complejidad: analisisComplejidad,
        },
        metodo: {
          codigo: metodo.codigo,
          nombre: metodo.nombre,
          variablesDisponibles: variablesDisponibles.map((v) => ({
            nombre: v.nombre,
            descripcion: v.descripcion,
            tipo: v.tipo,
            requerido: v.requerido,
          })),
        },
        sugerencias,
        contextoPrueba,
      },
      timestamp: new Date(),
    };

    logger.debug(`[FormulasCliente] Fórmula validada para método ${metodoCalculo}`, {
      valida: resultado.valida,
      metodo: metodoCalculo,
      variablesUtilizadas: analisisFormula.variablesEncontradas.length,
      usuario: (req as any).user?.email,
    });

    const mensaje = resultado.valida
      ? 'Fórmula validada exitosamente'
      : 'La fórmula contiene errores';

    ApiResponse.success(res, resultado, mensaje);
  } catch (error: any) {
    logger.error('[FormulasCliente] Error al validar fórmula:', error);
    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};

/**
 * Analiza la estructura de la fórmula
 */
function analizarFormula(formula: string): {
  longitud: number;
  variablesEncontradas: string[];
  funcionesUtilizadas: string[];
  operadoresUtilizados: string[];
  tieneParentesis: boolean;
  tieneCondicionales: boolean;
} {
  // Extraer variables (palabras que empiezan con letra)
  const variablesEncontradas = [
    ...new Set(
      (formula.match(/\b[A-Za-z][A-Za-z0-9_]*\b/g) || []).filter(
        (palabra) => !esFuncionConocida(palabra)
      )
    ),
  ];

  // Extraer funciones
  const funcionesUtilizadas = [
    ...new Set(
      (formula.match(/\b[A-Za-z][A-Za-z0-9_]*(?=\s*\()/g) || []).filter((func) =>
        esFuncionConocida(func)
      )
    ),
  ];

  // Extraer operadores
  const operadoresUtilizados = [...new Set(formula.match(/[+\-*/%^<>=!&|]/g) || [])];

  return {
    longitud: formula.length,
    variablesEncontradas,
    funcionesUtilizadas,
    operadoresUtilizados,
    tieneParentesis: /[()]/.test(formula),
    tieneCondicionales: /\b(SI|IF)\s*\(/.test(formula),
  };
}

/**
 * Valida la sintaxis de la fórmula
 */
async function validarSintaxis(formula: string): Promise<{
  valida: boolean;
  errores: string[];
  advertencias: string[];
}> {
  const errores: string[] = [];
  const advertencias: string[] = [];

  try {
    // Usar el validador existente
    const resultado = validarFormula(formula);

    if (resultado.valida) {
      // Validaciones adicionales

      // Verificar balance de paréntesis
      const parentesisBalance =
        (formula.match(/\(/g) || []).length - (formula.match(/\)/g) || []).length;
      if (parentesisBalance !== 0) {
        errores.push('Paréntesis desbalanceados');
      }

      // Verificar operadores consecutivos
      if (/[+\-*/%^]{2,}/.test(formula)) {
        errores.push('Operadores consecutivos detectados');
      }

      // Verificar división por cero literal
      if (/\/\s*0(?!\d)/.test(formula)) {
        advertencias.push('Posible división por cero detectada');
      }

      // Verificar complejidad excesiva
      if (formula.length > 500) {
        advertencias.push('Fórmula muy larga, considere simplificarla');
      }
    } else {
      errores.push(resultado.mensaje || 'Error de sintaxis en la fórmula');
    }
  } catch (error: any) {
    errores.push(`Error de validación: ${error.message}`);
  }

  return {
    valida: errores.length === 0,
    errores,
    advertencias,
  };
}

/**
 * Valida las variables utilizadas contra las disponibles
 */
function validarVariablesUtilizadas(
  variablesFormula: string[],
  variablesDisponibles: Map<string, any>
): {
  valida: boolean;
  errores: string[];
  advertencias: string[];
  variablesRequeridas: string[];
  variablesOpcionales: string[];
  variablesNoEncontradas: string[];
} {
  const errores: string[] = [];
  const advertencias: string[] = [];
  const variablesRequeridas: string[] = [];
  const variablesOpcionales: string[] = [];
  const variablesNoEncontradas: string[] = [];

  for (const variable of variablesFormula) {
    const definicion = variablesDisponibles.get(variable);

    if (!definicion) {
      variablesNoEncontradas.push(variable);
      errores.push(`Variable '${variable}' no está definida en el método`);
    } else {
      if (definicion.requerido) {
        variablesRequeridas.push(variable);
      } else {
        variablesOpcionales.push(variable);
      }

      // Advertencia por tipo de variable
      if (definicion.tipo === 'string' && !/[+]/.test(variablesFormula.join())) {
        advertencias.push(
          `Variable '${variable}' es de tipo texto, asegúrese de usarla correctamente`
        );
      }
    }
  }

  // Verificar si faltan variables importantes
  const variablesImportantes = ['Valor', 'Cantidad', 'Palets'];
  const faltanImportantes = variablesImportantes.filter(
    (v) => variablesDisponibles.has(v) && !variablesFormula.includes(v)
  );

  if (faltanImportantes.length > 0) {
    advertencias.push(`Considere utilizar: ${faltanImportantes.join(', ')}`);
  }

  return {
    valida: errores.length === 0,
    errores,
    advertencias,
    variablesRequeridas,
    variablesOpcionales,
    variablesNoEncontradas,
  };
}

/**
 * Prepara el contexto de prueba
 */
function prepararContextoPrueba(
  variablesDisponibles: any[],
  variables: any,
  contextoTesting: any
): any {
  const contexto: any = {
    // Valores por defecto para testing
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
  };

  // Aplicar valores específicos proporcionados
  for (const [nombre, valor] of Object.entries(variables)) {
    contexto[nombre] = valor;
  }

  // Aplicar valores por defecto de las variables definidas
  for (const variable of variablesDisponibles) {
    if (variable.valorPorDefecto !== undefined && contexto[variable.nombre] === undefined) {
      contexto[variable.nombre] = variable.valorPorDefecto;
    }
  }

  return contexto;
}

/**
 * Ejecuta una fórmula para obtener el resultado numérico
 */
async function ejecutarFormulaNumerica(
  formula: string,
  contexto: any
): Promise<{
  exitosa: boolean;
  valor?: number;
  error?: string;
}> {
  try {
    // Usar el evaluador de fórmulas del utils
    const { evaluarFormula } = require('../../utils/formulaParser');
    const resultado = evaluarFormula(formula, contexto);

    if (typeof resultado === 'number' && !isNaN(resultado) && isFinite(resultado)) {
      return {
        exitosa: true,
        valor: resultado,
      };
    } else {
      return {
        exitosa: false,
        error: 'El resultado no es un número válido',
      };
    }
  } catch (error: any) {
    return {
      exitosa: false,
      error: error.message,
    };
  }
}

/**
 * Ejecuta una prueba de cálculo
 */
async function ejecutarPruebaCalculo(
  formula: string,
  contexto: any
): Promise<{
  exitosa: boolean;
  resultado?: number;
  error?: string;
  tiempoEjecucion?: number;
}> {
  try {
    const inicio = Date.now();

    // Ejecutar la fórmula con el contexto
    const resultado = validarFormula(formula, contexto);

    const tiempoEjecucion = Date.now() - inicio;

    if (resultado.valida) {
      // Ejecutar la fórmula para obtener el resultado numérico
      const evaluacionNumerica = await ejecutarFormulaNumerica(formula, contexto);
      if (evaluacionNumerica.exitosa) {
        return {
          exitosa: true,
          resultado: evaluacionNumerica.valor,
          tiempoEjecucion,
        };
      }
    }

    return {
      exitosa: false,
      error: resultado.mensaje || 'Resultado no válido',
      tiempoEjecucion,
    };
  } catch (error: any) {
    return {
      exitosa: false,
      error: error.message,
    };
  }
}

/**
 * Analiza la complejidad de la fórmula
 */
function analizarComplejidad(formula: string): {
  nivel: string;
  puntuacion: number;
  factores: string[];
} {
  let puntuacion = 0;
  const factores: string[] = [];

  // Factor: Longitud
  if (formula.length > 100) {
    puntuacion += 2;
    factores.push('Fórmula larga');
  }

  // Factor: Funciones anidadas
  const niveles_anidamiento = (formula.match(/\(/g) || []).length;
  if (niveles_anidamiento > 3) {
    puntuacion += 3;
    factores.push('Funciones anidadas');
  }

  // Factor: Condicionales
  if (/\b(SI|IF)\s*\(/.test(formula)) {
    puntuacion += 2;
    factores.push('Lógica condicional');
  }

  // Factor: Muchas variables
  const variablesUnicas = [...new Set(formula.match(/\b[A-Za-z][A-Za-z0-9_]*\b/g) || [])];
  if (variablesUnicas.length > 8) {
    puntuacion += 2;
    factores.push('Muchas variables');
  }

  let nivel: string;
  if (puntuacion <= 2) nivel = 'Baja';
  else if (puntuacion <= 5) nivel = 'Media';
  else if (puntuacion <= 8) nivel = 'Alta';
  else nivel = 'Muy Alta';

  return {
    nivel,
    puntuacion,
    factores,
  };
}

/**
 * Genera sugerencias de mejora
 */
function generarSugerencias(
  formula: string,
  analisis: any,
  _validacionVariables: any,
  _metodo: any
): string[] {
  const sugerencias: string[] = [];

  // Sugerencia: Simplificar fórmula compleja
  if (formula.length > 200) {
    sugerencias.push('Considere dividir esta fórmula compleja en varias más simples');
  }

  // Sugerencia: Usar variables estándar
  if (!analisis.variablesEncontradas.includes('Valor')) {
    sugerencias.push('Considere incluir la variable "Valor" como base del cálculo');
  }

  // Sugerencia: Documentación
  if (analisis.variablesEncontradas.length > 5) {
    sugerencias.push('Con tantas variables, asegúrese de documentar bien la fórmula');
  }

  // Sugerencia: Validación de rangos
  if (!formula.includes('MAX') && !formula.includes('MIN')) {
    sugerencias.push('Considere usar MAX() o MIN() para validar rangos de valores');
  }

  // Sugerencia: Manejo de errores
  if (formula.includes('/') && !formula.includes('SI(')) {
    sugerencias.push('Para divisiones, considere validar que el divisor no sea cero');
  }

  return sugerencias;
}

/**
 * Verifica si una palabra es una función conocida
 */
function esFuncionConocida(palabra: string): boolean {
  const funcionesConocidas = [
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
  ];

  return funcionesConocidas.includes(palabra.toUpperCase());
}
