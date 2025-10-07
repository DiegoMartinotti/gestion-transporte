import { Response } from 'express';
import tarifaEngine, { IContextoCalculo, IResultadoCalculo } from '../../services/tarifaEngine';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import type {
  SimulacionConfiguracion,
  SimulacionEscenario,
  SimulacionResultado,
  SimulacionAnalisisResultado,
  SimulacionError,
  SimulacionCalculo,
  SimulateTarifaRequest,
} from './simulateTarifa.types';

export const simulateTarifaValidators = [
  body('escenarios').isArray({ min: 1 }).withMessage('Debe proporcionar al menos un escenario'),
  body('escenarios.*.nombre').notEmpty().withMessage('Cada escenario debe tener un nombre'),
  body('escenarios.*.clienteId')
    .notEmpty()
    .withMessage('El ID del cliente es requerido')
    .custom((value: unknown) => {
      if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) {
        throw new Error('ID de cliente no válido');
      }
      return true;
    }),
  body('escenarios.*.origenId')
    .notEmpty()
    .withMessage('El ID del origen es requerido')
    .custom((value: unknown) => {
      if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) {
        throw new Error('ID de origen no válido');
      }
      return true;
    }),
  body('escenarios.*.destinoId')
    .notEmpty()
    .withMessage('El ID del destino es requerido')
    .custom((value: unknown) => {
      if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) {
        throw new Error('ID de destino no válido');
      }
      return true;
    }),
  body('escenarios.*.tipoUnidad').notEmpty().withMessage('El tipo de unidad es requerido'),
  body('configuracion.compararMetodos')
    .optional()
    .isBoolean()
    .withMessage('CompararMetodos debe ser verdadero o falso'),
  body('configuracion.incluirDesglose')
    .optional()
    .isBoolean()
    .withMessage('IncluirDesglose debe ser verdadero o falso'),
  body('configuracion.aplicarReglas')
    .optional()
    .isBoolean()
    .withMessage('AplicarReglas debe ser verdadero o falso'),
];

/**
 * Simula cálculos de tarifa para múltiples escenarios
 * Útil para análisis comparativo y testing
 */
// eslint-disable-next-line complexity, max-lines-per-function
export const simulateTarifa = async (req: SimulateTarifaRequest, res: Response): Promise<void> => {
  try {
    // Validar entrada
    const errors = validationResult(req as unknown as Record<string, unknown>);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Datos de entrada inválidos', 400, { detalles: errors.array() });
      return;
    }

    const { escenarios, configuracion: configuracionEntrada } = req.body;

    const configuracion: SimulacionConfiguracion = {
      compararMetodos: false,
      incluirDesglose: false,
      aplicarReglas: true,
      usarCache: false, // No usar cache para simulaciones
      ...(configuracionEntrada ?? {}),
    };

    logger.info('[TarifaEngine] Iniciando simulación de tarifas', {
      cantidadEscenarios: escenarios.length,
      configuracion,
      usuario: req.user?.email,
    });

    const startTime = Date.now();
    const resultados: SimulacionResultado[] = [];
    const errores: SimulacionError[] = [];

    // Procesar cada escenario
    for (let i = 0; i < escenarios.length; i++) {
      const escenario = escenarios[i];

      try {
        logger.debug(`[TarifaEngine] Procesando escenario ${i + 1}: ${escenario.nombre}`);

        const resultadoEscenario = await calcularEscenario(escenario, configuracion);
        resultados.push(resultadoEscenario);
      } catch (error: unknown) {
        const errorInfo = {
          escenario: escenario.nombre,
          error: error instanceof Error ? error.message : String(error),
          parametros: {
            clienteId: escenario.clienteId,
            origenId: escenario.origenId,
            destinoId: escenario.destinoId,
          },
        };
        errores.push(errorInfo);
        logger.error(`[TarifaEngine] Error en escenario ${escenario.nombre}:`, error);
      }
    }

    const tiempoTotal = Date.now() - startTime;

    const respuesta = {
      resultados,
      errores,
      resumen: {
        totalEscenarios: escenarios.length,
        exitosos: resultados.length,
        conErrores: errores.length,
        tiempoTotal,
      },
      configuracion,
      metadatos: {
        timestamp: new Date(),
        usuario: req.user?.email || 'desconocido',
      },
    };

    logger.info('[TarifaEngine] Simulación completada', {
      totalEscenarios: escenarios.length,
      exitosos: resultados.length,
      errores: errores.length,
      tiempoTotal,
    });

    ApiResponse.success(res, respuesta, 'Simulación completada exitosamente');
  } catch (error: unknown) {
    logger.error('[TarifaEngine] Error en simulación de tarifas:', error);
    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};

async function calcularEscenario(
  escenario: SimulacionEscenario,
  configuracion: SimulacionConfiguracion
): Promise<SimulacionResultado> {
  const resultadosEscenario: SimulacionResultado = {
    nombre: escenario.nombre,
    parametros: {
      clienteId: escenario.clienteId,
      origenId: escenario.origenId,
      destinoId: escenario.destinoId,
      tipoUnidad: escenario.tipoUnidad,
      fecha: escenario.fecha ? new Date(escenario.fecha) : new Date(),
      palets: escenario.palets,
      peso: escenario.peso,
      metodoCalculo: escenario.metodoCalculo,
      volumen: escenario.volumen,
      cantidadBultos: escenario.cantidadBultos,
    },
    calculos: {},
  };

  if (configuracion.compararMetodos && !escenario.metodoCalculo) {
    resultadosEscenario.calculos = await simularConMultiplesMetodos(escenario, configuracion);
  } else {
    resultadosEscenario.calculos = await simularConMetodoUnico(escenario, configuracion);
  }

  if (configuracion.incluirAnalisis) {
    resultadosEscenario.analisis = await generarAnalisisSimulacion(resultadosEscenario);
  }

  return resultadosEscenario;
}

/**
 * Simula con múltiples métodos de cálculo
 */
async function simularConMultiplesMetodos(
  escenario: SimulacionEscenario,
  configuracion: SimulacionConfiguracion
): Promise<Record<string, SimulacionCalculo>> {
  const metodosComparar = ['PALET', 'KILOMETRO', 'FIJO'];
  const calculos: Record<string, SimulacionCalculo> = {};

  for (const metodo of metodosComparar) {
    try {
      const contexto = construirContexto(escenario, configuracion, metodo);
      const resultado = await tarifaEngine.calcular(contexto);

      calculos[metodo] = {
        ...resultado,
        metodoUtilizado: resultado.metodoUtilizado || metodo,
      };
    } catch (error: unknown) {
      calculos[metodo] = {
        error: error instanceof Error ? error.message : String(error),
        metodoUtilizado: metodo,
      };
    }
  }

  return calculos;
}

/**
 * Simula con un método único
 */
async function simularConMetodoUnico(
  escenario: SimulacionEscenario,
  configuracion: SimulacionConfiguracion
): Promise<Record<string, SimulacionCalculo>> {
  try {
    const contexto = construirContexto(escenario, configuracion);
    const resultado = await tarifaEngine.calcular(contexto);

    return {
      principal: {
        ...resultado,
        metodoUtilizado: resultado.metodoUtilizado || escenario.metodoCalculo || 'automático',
      },
    };
  } catch (error: unknown) {
    return {
      principal: {
        error: error instanceof Error ? error.message : String(error),
        metodoUtilizado: escenario.metodoCalculo || 'automático',
      },
    };
  }
}

/**
 * Genera análisis de la simulación
 */
async function generarAnalisisSimulacion(
  resultadosEscenario: SimulacionResultado
): Promise<SimulacionAnalisisResultado> {
  const calculos = Object.values(resultadosEscenario.calculos);
  const calculosExitosos = calculos.filter(
    (calculo): calculo is IResultadoCalculo => !('error' in calculo)
  );

  if (calculosExitosos.length === 0) {
    return { error: 'No hay cálculos exitosos para analizar' };
  }

  const totales = calculosExitosos.map((c) => c.total || 0);

  return {
    totalMinimo: Math.min(...totales),
    totalMaximo: Math.max(...totales),
    totalPromedio: totales.reduce((a, b) => a + b, 0) / totales.length,
    variacion: Math.max(...totales) - Math.min(...totales),
    metodosExitosos: calculosExitosos.length,
    metodosConError: calculos.length - calculosExitosos.length,
  };
}

/**
 * Construye el contexto de cálculo para un escenario
 */
function construirContexto(
  escenario: SimulacionEscenario,
  configuracion: SimulacionConfiguracion,
  metodoOverride?: string
): IContextoCalculo {
  return {
    clienteId: new Types.ObjectId(escenario.clienteId),
    origenId: new Types.ObjectId(escenario.origenId),
    destinoId: new Types.ObjectId(escenario.destinoId),
    fecha: escenario.fecha ? new Date(escenario.fecha) : new Date(),
    tipoTramo: escenario.tipoTramo || 'TRMC',
    tipoUnidad: escenario.tipoUnidad,
    metodoCalculo: metodoOverride || escenario.metodoCalculo,
    palets: escenario.palets,
    peso: escenario.peso,
    volumen: escenario.volumen,
    cantidadBultos: escenario.cantidadBultos,
    vehiculos: escenario.vehiculos,
    urgencia: escenario.urgencia,
    extras: escenario.extras,
    aplicarReglas: configuracion.aplicarReglas !== false,
    usarCache: false, // No usar cache en simulaciones
    incluirDesgloseCalculo: configuracion.incluirDesglose || false,
  };
}
