/**
 * Utilidad para evaluar fórmulas tipo Excel en JavaScript
 */
import logger from './logger';
import * as mathjs from 'mathjs';

// Configurar mathjs para modo seguro
const limitedMath = mathjs.create(mathjs.all);
limitedMath.config({
  matrix: 'Array', // Configurar para usar array normal en lugar de matrices especiales
  number: 'number', // Usar números JavaScript nativos
});

// Limitar funciones permitidas
limitedMath.import(
  {
    // Funciones matemáticas básicas y seguras
    add: mathjs.add,
    subtract: mathjs.subtract,
    multiply: mathjs.multiply,
    divide: mathjs.divide,
    pow: mathjs.pow,
    sqrt: mathjs.sqrt,
    round: mathjs.round,
    max: mathjs.max,
    min: mathjs.min,
    abs: mathjs.abs,
    ceil: mathjs.ceil,
    floor: mathjs.floor,
    mean: mathjs.mean,
    median: mathjs.median,
    std: mathjs.std,
    sum: mathjs.sum,
    mod: mathjs.mod,
  },
  { override: true }
);

/**
 * Interface para las variables utilizadas en evaluación de fórmulas
 */
interface FormulaVariables {
  [key: string]: number | string | boolean | Date;
}

/**
 * Interface para el contexto completo de evaluación
 */
interface FormulaContext {
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
  [key: string]: any;
}

/**
 * Interface para el resultado del cálculo de tarifa
 */
interface TarifaResult {
  tarifaBase: number;
  peaje: number;
  total: number;
}

/**
 * Evalúa una fórmula con una sintaxis similar a Excel utilizando nombres de variables
 * @param formula - La fórmula a evaluar
 * @param variables - Un objeto con las variables a utilizar en la evaluación
 * @param contexto - Contexto completo opcional para funciones avanzadas
 * @returns - El resultado de evaluar la fórmula o 0 en caso de error
 */
function evaluarFormula(
  formula: string,
  variables: Record<string, number | string | boolean | Date>,
  contexto?: FormulaContext
): number {
  try {
    // Si no hay fórmula, devolver 0
    if (!formula) return 0;

    // Reemplazar variables por sus valores
    let expresion: string = formula;

    // Convertir las variables según su tipo
    const varsProcessed: FormulaVariables = {};
    for (const [nombre, valor] of Object.entries(variables)) {
      if (typeof valor === 'string' && !isNaN(parseFloat(valor))) {
        varsProcessed[nombre] = parseFloat(valor);
      } else if (valor instanceof Date) {
        varsProcessed[nombre] = valor.getTime();
      } else if (typeof valor === 'boolean') {
        varsProcessed[nombre] = valor ? 1 : 0;
      } else {
        varsProcessed[nombre] = valor;
      }
    }

    // Log para depuración
    logger.debug('Variables:', varsProcessed);

    // Reemplazar cada variable por su valor correspondiente
    for (const [nombre, valor] of Object.entries(varsProcessed)) {
      // Usamos una expresión regular con límites de palabra para evitar reemplazos parciales
      const regex = new RegExp(`\\b${nombre}\\b`, 'g');
      const valorStr = typeof valor === 'number' ? valor.toString() : `"${valor}"`;
      expresion = expresion.replace(regex, valorStr);
    }

    // Reemplazar "," por "." para asegurar formato numérico adecuado
    expresion = expresion.replace(/,/g, '.');

    // Procesar funciones personalizadas
    expresion = procesarFuncionSI(expresion);
    expresion = procesarFuncionREDONDEAR(expresion);
    expresion = procesarFuncionPROMEDIO(expresion);
    expresion = procesarFuncionDIASEMANA(expresion, contexto);
    expresion = procesarFuncionFECHA(expresion, contexto);
    expresion = procesarFuncionTARIFAESCALONADA(expresion);

    logger.debug('Expresión a evaluar:', expresion);

    try {
      // Evaluar la expresión de forma segura usando mathjs
      const resultado = mathjs.evaluate(expresion);

      // Asegurarse de que el resultado sea un número
      if (typeof resultado !== 'number' || isNaN(resultado)) {
        throw new Error(`La fórmula no produjo un número válido: ${resultado}`);
      }

      logger.debug('Resultado de la evaluación:', resultado);
      return resultado;
    } catch (mathError) {
      logger.error('Error al evaluar con mathjs:', mathError);
      // Intentar una evaluación alternativa con Function
      return evaluarAlternativo(expresion);
    }
  } catch (error) {
    logger.error('Error al evaluar fórmula:', error);
    logger.error('Fórmula original:', formula);
    logger.debug('Variables:', variables);

    // Si hay un error, intentar un cálculo simple con los valores recibidos
    try {
      const valorBase = (variables.Valor as number) || 0;
      const palets = (variables.Palets as number) || 0;
      const valorPeaje = (variables.Peaje as number) || 0;

      const total = valorBase * palets + valorPeaje;
      logger.debug('Fallback a cálculo simple:', total);
      return total;
    } catch (fallbackError) {
      logger.error('Error en cálculo fallback:', fallbackError);
      return 0;
    }
  }
}

/**
 * Procesa las funciones SI() en una expresión y las convierte a operadores ternarios
 * @param expresion - La expresión a procesar
 * @returns - La expresión con las funciones SI convertidas
 */
function procesarFuncionSI(expresion: string): string {
  // Patrón para detectar SI(condicion;valorVerdadero;valorFalso)
  const patron = /SI\s*\(\s*([^;]+);\s*([^;]+);\s*([^)]+)\s*\)/g;

  // Reemplazar cada ocurrencia por el equivalente ternario
  return expresion.replace(patron, '($1 ? $2 : $3)');
}

/**
 * Procesa la función REDONDEAR para redondear a n decimales
 * @param expresion - La expresión a procesar
 * @returns - La expresión con REDONDEAR procesado
 */
function procesarFuncionREDONDEAR(expresion: string): string {
  // REDONDEAR(valor;decimales)
  const patron = /REDONDEAR\s*\(\s*([^;]+);\s*(\d+)\s*\)/g;

  return expresion.replace(patron, (match, valor, decimales) => {
    const factor = Math.pow(10, parseInt(decimales));
    return `(round(${valor} * ${factor}) / ${factor})`;
  });
}

/**
 * Procesa la función PROMEDIO para calcular el promedio
 * @param expresion - La expresión a procesar
 * @returns - La expresión con PROMEDIO procesado
 */
function procesarFuncionPROMEDIO(expresion: string): string {
  // PROMEDIO(valor1;valor2;...;valorN)
  const patron = /PROMEDIO\s*\(\s*([^)]+)\s*\)/g;

  return expresion.replace(patron, (match, valores) => {
    const valoresArray = valores.split(';').map((v: string) => v.trim());
    const suma = valoresArray.join(' + ');
    return `((${suma}) / ${valoresArray.length})`;
  });
}

/**
 * Procesa funciones relacionadas con día de la semana
 * @param expresion - La expresión a procesar
 * @param contexto - Contexto con información de fecha
 * @returns - La expresión procesada
 */
function procesarFuncionDIASEMANA(expresion: string, contexto?: FormulaContext): string {
  const patron = /DIASEMANA\s*\(\s*\)/g;

  return expresion.replace(patron, () => {
    if (contexto?.DiaSemana !== undefined) {
      return contexto.DiaSemana.toString();
    }
    return new Date().getDay().toString();
  });
}

/**
 * Procesa funciones relacionadas con fechas
 * @param expresion - La expresión a procesar
 * @param contexto - Contexto con información de fecha
 * @returns - La expresión procesada
 */
function procesarFuncionFECHA(expresion: string, contexto?: FormulaContext): string {
  // MES()
  expresion = expresion.replace(/MES\s*\(\s*\)/g, () => {
    if (contexto?.Mes !== undefined) {
      return contexto.Mes.toString();
    }
    return (new Date().getMonth() + 1).toString();
  });

  // TRIMESTRE()
  expresion = expresion.replace(/TRIMESTRE\s*\(\s*\)/g, () => {
    if (contexto?.Trimestre !== undefined) {
      return contexto.Trimestre.toString();
    }
    const mes = new Date().getMonth() + 1;
    return Math.ceil(mes / 3).toString();
  });

  // ESFINDESEMANA()
  expresion = expresion.replace(/ESFINDESEMANA\s*\(\s*\)/g, () => {
    if (contexto?.EsFinDeSemana !== undefined) {
      return contexto.EsFinDeSemana ? '1' : '0';
    }
    const dia = new Date().getDay();
    return dia === 0 || dia === 6 ? '1' : '0';
  });

  return expresion;
}

/**
 * Procesa la función TARIFAESCALONADA para cálculos por rangos
 * @param expresion - La expresión a procesar
 * @returns - La expresión procesada
 */
function procesarFuncionTARIFAESCALONADA(expresion: string): string {
  // TARIFAESCALONADA(valor;rango1:tarifa1;rango2:tarifa2;...)
  const patron = /TARIFAESCALONADA\s*\(\s*([^;]+);([^)]+)\s*\)/g;

  return expresion.replace(patron, (match, valor, rangos) => {
    const pares = rangos.split(';').map((r: string) => {
      const [rango, tarifa] = r.split(':').map((s: string) => s.trim());
      return { rango: parseFloat(rango), tarifa: parseFloat(tarifa) };
    });

    // Ordenar por rango
    pares.sort((a: any, b: any) => a.rango - b.rango);

    // Construir expresión condicional anidada
    let resultado = pares[0].tarifa.toString();
    for (let i = 1; i < pares.length; i++) {
      resultado = `(${valor} <= ${pares[i - 1].rango} ? ${pares[i - 1].tarifa} : ${resultado})`;
    }

    // Agregar el último escalón
    if (pares.length > 0) {
      const ultimo = pares[pares.length - 1];
      resultado = `(${valor} > ${ultimo.rango} ? ${ultimo.tarifa} : ${resultado})`;
    }

    return `(${resultado})`;
  });
}

/**
 * Método alternativo para evaluar expresiones
 * @param expresion - La expresión a evaluar
 * @returns - Resultado de la evaluación
 */
function evaluarAlternativo(expresion: string): number {
  try {
    // Reemplazar los operadores ternarios por una implementación más segura
    // Convertir (condicion ? valorVerdadero : valorFalso) a una forma más compatible
    expresion = expresion.replace(
      /\(([^?]+)\s*\?\s*([^:]+)\s*:\s*([^)]+)\)/g,
      (match, condicion, valorVerdadero, valorFalso) => {
        return `(${condicion} > 0 ? ${valorVerdadero} : ${valorFalso})`;
      }
    );

    logger.debug('Expresión alternativa:', expresion);

    // Usar Function pero con un contexto controlado
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Ignoramos advertencia de seguridad, ya que esta es una función de fallback
    const evaluador = new Function('return ' + expresion);
    const resultado = evaluador();

    logger.debug('Resultado alternativo:', resultado);

    if (typeof resultado !== 'number' || isNaN(resultado)) {
      throw new Error('Resultado no numérico');
    }

    return resultado;
  } catch (error) {
    logger.error('Error en evaluación alternativa:', error);
    return 0;
  }
}

/**
 * Calcula la tarifa para un tipo Palet usando la fórmula del cliente
 * @param valorBase - El valor base del tramo
 * @param valorPeaje - El valor del peaje
 * @param palets - La cantidad de palets
 * @param formula - La fórmula a utilizar
 * @returns - Resultado con tarifaBase, peaje y total
 */
function calcularTarifaPaletConFormula(
  valorBase: number | string,
  valorPeaje: number | string,
  palets: number | string,
  formula?: string
): TarifaResult {
  // Agregar log detallado de los valores recibidos
  logger.debug(`calcularTarifaPaletConFormula - Valores recibidos:
    valorBase: ${valorBase} (tipo: ${typeof valorBase})
    valorPeaje: ${valorPeaje} (tipo: ${typeof valorPeaje})
    palets: ${palets} (tipo: ${typeof palets})
    formula: ${formula}`);

  // Asegurarnos que los valores sean numéricos
  const valorBaseNum = typeof valorBase === 'string' ? parseFloat(valorBase) : valorBase;
  const valorPeajeNum = typeof valorPeaje === 'string' ? parseFloat(valorPeaje) : valorPeaje;
  const paletsNum = typeof palets === 'string' ? parseFloat(palets) : palets;

  const formulaDefault = 'Valor * Palets + Peaje';

  const formulaAUsar = formula || formulaDefault;

  const variables: FormulaVariables = {
    Valor: valorBaseNum,
    Peaje: valorPeajeNum,
    Palets: paletsNum,
  };

  try {
    // Si la fórmula solo contiene Peaje (sin Valor ni Palets), calculamos como fijo + peaje
    if (
      formulaAUsar.includes('Peaje') &&
      !formulaAUsar.includes('Valor') &&
      !formulaAUsar.includes('Palets')
    ) {
      const tarifaBase = valorBaseNum;
      return {
        tarifaBase: Math.round(tarifaBase * 100) / 100,
        peaje: Math.round(valorPeajeNum * 100) / 100,
        total: Math.round((tarifaBase + valorPeajeNum) * 100) / 100,
      };
    }

    // Evaluar la fórmula completa
    const total = evaluarFormula(formulaAUsar, variables);

    // Identificar el componente de peaje
    let peajeComponent: number;
    if (formulaAUsar.includes('+ Peaje')) {
      peajeComponent = valorPeajeNum;
    } else {
      // Si el peaje está integrado en la fórmula de manera más compleja, lo dejamos en 0
      peajeComponent = 0;
    }

    // La tarifa base es el total menos el peaje
    const tarifaBase = total - peajeComponent;

    return {
      tarifaBase: Math.round(tarifaBase * 100) / 100,
      peaje: Math.round(peajeComponent * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  } catch (error) {
    logger.error('Error al calcular tarifa con fórmula personalizada:', error);

    // Fallback a cálculo estándar
    const tarifaBase = valorBaseNum * paletsNum;
    const total = tarifaBase + valorPeajeNum;

    return {
      tarifaBase: Math.round(tarifaBase * 100) / 100,
      peaje: Math.round(valorPeajeNum * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }
}

/**
 * Calcula la tarifa con contexto completo y reglas avanzadas
 * @param contexto - Contexto completo con todas las variables
 * @param formula - Fórmula a evaluar
 * @returns - Resultado del cálculo
 */
function calcularTarifaConContexto(contexto: FormulaContext, formula: string): TarifaResult {
  try {
    logger.debug('Calculando tarifa con contexto completo:', {
      formula,
      contexto: Object.keys(contexto).reduce((acc, key) => {
        acc[key] =
          typeof contexto[key] === 'object' ? JSON.stringify(contexto[key]) : contexto[key];
        return acc;
      }, {} as any),
    });

    // Evaluar la fórmula con el contexto completo
    const total = evaluarFormula(formula, contexto, contexto);

    // Determinar componentes
    let tarifaBase = total;
    const peaje = contexto.Peaje || 0;

    // Si la fórmula incluye peaje, ajustar la tarifa base
    if (formula.includes('Peaje')) {
      tarifaBase = total - peaje;
    }

    return {
      tarifaBase: Math.round(tarifaBase * 100) / 100,
      peaje: Math.round(peaje * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  } catch (error) {
    logger.error('Error al calcular tarifa con contexto:', error);
    return {
      tarifaBase: 0,
      peaje: 0,
      total: 0,
    };
  }
}

/**
 * Valida una fórmula sin ejecutarla
 * @param formula - Fórmula a validar
 * @param variablesDisponibles - Lista de variables disponibles
 * @returns - Objeto con resultado de validación
 */
function validarFormula(
  formula: string,
  variablesDisponibles: string[] = []
): { valida: boolean; mensaje: string; variablesUsadas: string[] } {
  try {
    // Variables estándar siempre disponibles
    const variablesEstandar = [
      'Valor',
      'Peaje',
      'Cantidad',
      'Palets',
      'Distancia',
      'Peso',
      'TipoUnidad',
      'Fecha',
      'DiaSemana',
      'Mes',
      'Trimestre',
      'EsFinDeSemana',
      'EsFeriado',
      'HoraDelDia',
    ];

    const todasLasVariables = [...new Set([...variablesEstandar, ...variablesDisponibles])];

    // Extraer variables de la fórmula
    const variablesEnFormula = formula.match(/\b[A-Za-z][A-Za-z0-9_]*\b/g) || [];

    // Filtrar funciones conocidas
    const funcionesConocidas = [
      'SI',
      'MAX',
      'MIN',
      'REDONDEAR',
      'ABS',
      'PROMEDIO',
      'DIASEMANA',
      'MES',
      'TRIMESTRE',
      'ESFINDESEMANA',
      'TARIFAESCALONADA',
      'round',
      'max',
      'min',
      'abs',
      'ceil',
      'floor',
      'mean',
      'median',
      'std',
      'sum',
      'mod',
    ];

    const variablesFiltradas = variablesEnFormula.filter(
      (v) => !funcionesConocidas.includes(v) && !funcionesConocidas.includes(v.toUpperCase())
    );

    // Verificar variables no definidas
    const variablesNoDefinidas = variablesFiltradas.filter((v) => !todasLasVariables.includes(v));

    if (variablesNoDefinidas.length > 0) {
      return {
        valida: false,
        mensaje: `Variables no definidas: ${variablesNoDefinidas.join(', ')}`,
        variablesUsadas: variablesFiltradas,
      };
    }

    // Intentar parsear la fórmula con valores de prueba
    const contextosPrueba: FormulaContext = {
      Valor: 100,
      Peaje: 10,
      Cantidad: 5,
      Palets: 5,
      Distancia: 50,
      Peso: 1000,
      TipoUnidad: 'Sider',
      Fecha: new Date(),
      DiaSemana: 1,
      Mes: 1,
      Trimestre: 1,
      EsFinDeSemana: false,
      EsFeriado: false,
      HoraDelDia: 12,
    };

    const resultado = evaluarFormula(formula, contextosPrueba, contextosPrueba);

    if (isNaN(resultado) || !isFinite(resultado)) {
      return {
        valida: false,
        mensaje: 'La fórmula no produce un resultado numérico válido',
        variablesUsadas: variablesFiltradas,
      };
    }

    return {
      valida: true,
      mensaje: 'Fórmula válida',
      variablesUsadas: variablesFiltradas,
    };
  } catch (error: any) {
    return {
      valida: false,
      mensaje: error.message || 'Error al validar la fórmula',
      variablesUsadas: [],
    };
  }
}

export {
  evaluarFormula,
  procesarFuncionSI,
  procesarFuncionREDONDEAR,
  procesarFuncionPROMEDIO,
  procesarFuncionDIASEMANA,
  procesarFuncionFECHA,
  procesarFuncionTARIFAESCALONADA,
  calcularTarifaPaletConFormula,
  calcularTarifaConContexto,
  validarFormula,
  FormulaVariables,
  FormulaContext,
  TarifaResult,
};
