import { Request, Response } from 'express';
import tarifaEngine, { IContextoCalculo } from '../../services/tarifaEngine';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';

/**
 * Validators para simulación de tarifa
 */
export const simulateTarifaValidators = [
  body('escenarios').isArray({ min: 1 }).withMessage('Debe proporcionar al menos un escenario'),
  body('escenarios.*.nombre').notEmpty().withMessage('Cada escenario debe tener un nombre'),
  body('escenarios.*.clienteId')
    .notEmpty()
    .withMessage('El ID del cliente es requerido')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('ID de cliente no válido');
      }
      return true;
    }),
  body('escenarios.*.origenId')
    .notEmpty()
    .withMessage('El ID del origen es requerido')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('ID de origen no válido');
      }
      return true;
    }),
  body('escenarios.*.destinoId')
    .notEmpty()
    .withMessage('El ID del destino es requerido')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
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
export const simulateTarifa = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Datos de entrada inválidos', 400, errors.array());
      return;
    }

    const {
      escenarios,
      configuracion = {
        compararMetodos: false,
        incluirDesglose: false,
        aplicarReglas: true,
        usarCache: false, // No usar cache para simulaciones
      },
    } = req.body;

    logger.info('[TarifaEngine] Iniciando simulación de tarifas', {
      cantidadEscenarios: escenarios.length,
      configuracion,
      usuario: (req as unknown).user?.email,
    });

    const startTime = Date.now();
    const resultados = [];
    const errores = [];

    // Procesar cada escenario
    for (let i = 0; i < escenarios.length; i++) {
      const escenario = escenarios[i];

      try {
        logger.debug(`[TarifaEngine] Procesando escenario ${i + 1}: ${escenario.nombre}`);

        const resultadosEscenario: unknown = {
          nombre: escenario.nombre,
          parametros: {
            clienteId: escenario.clienteId,
            origenId: escenario.origenId,
            destinoId: escenario.destinoId,
            tipoUnidad: escenario.tipoUnidad,
            fecha: escenario.fecha || new Date(),
            palets: escenario.palets,
            peso: escenario.peso,
            metodoCalculo: escenario.metodoCalculo,
          },
          calculos: {},
        };

        if (configuracion.compararMetodos && !escenario.metodoCalculo) {
          // Simular con diferentes métodos de cálculo
          resultadosEscenario.calculos = await simularConMultiplesMetodos(escenario, configuracion);
        } else {
          // Simular con método específico o automático
          resultadosEscenario.calculos = await simularConMetodoUnico(escenario, configuracion);
        }

        // Agregar análisis si está configurado
        if (configuracion.incluirAnalisis) {
          resultadosEscenario.analisis = await generarAnalisisSimulacion(resultadosEscenario);
        }

        resultados.push(resultadosEscenario);
      } catch (error: unknown) {
        const errorInfo = {
          escenario: escenario.nombre,
          error: (error instanceof Error ? error.message : String(error)),
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
        usuario: (req as unknown).user?.email || 'desconocido',
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

/**
 * Simula con múltiples métodos de cálculo
 */
async function simularConMultiplesMetodos(
  escenario: unknown,
  configuracion: unknown
): Promise<Record<string, unknown>> {
  const metodosComparar = ['PALET', 'KILOMETRO', 'FIJO'];
  const calculos: Record<string, unknown> = {};

  for (const metodo of metodosComparar) {
    try {
      const contexto = construirContexto(escenario, configuracion, metodo);
      const resultado = await tarifaEngine.calcular(contexto);

      calculos[metodo] = {
        ...resultado,
        metodoUtilizado: metodo,
      };
    } catch (error: unknown) {
      calculos[metodo] = {
        error: (error instanceof Error ? error.message : String(error)),
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
  escenario: unknown,
  configuracion: unknown
): Promise<Record<string, unknown>> {
  try {
    const contexto = construirContexto(escenario, configuracion);
    const resultado = await tarifaEngine.calcular(contexto);

    return {
      principal: {
        ...resultado,
        metodoUtilizado: escenario.metodoCalculo || 'automático',
      },
    };
  } catch (error: unknown) {
    return {
      principal: {
        error: (error instanceof Error ? error.message : String(error)),
        metodoUtilizado: escenario.metodoCalculo || 'automático',
      },
    };
  }
}

/**
 * Genera análisis de la simulación
 */
async function generarAnalisisSimulacion(resultadosEscenario: unknown): Promise<any> {
  const calculos = Object.values(resultadosEscenario.calculos);
  const calculosExitosos = calculos.filter((c: unknown) => !c.error);

  if (calculosExitosos.length === 0) {
    return { error: 'No hay cálculos exitosos para analizar' };
  }

  const totales = calculosExitosos.map((c: unknown) => c.total || 0);

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
  escenario: unknown,
  configuracion: unknown,
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
