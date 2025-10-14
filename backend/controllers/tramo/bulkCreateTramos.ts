/**
 * @module controllers/tramo/bulkCreateTramos
 * @description Controlador para creación masiva de tramos
 */

import { Request, Response } from 'express';
import type { TramoData } from '../../services/tramo/tramoProcessingHelpers';
import * as tramoService from '../../services/tramo/tramoService';
import logger from '../../utils/logger';

/**
 * Interface for API responses
 */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Interface for bulk import request
 */
interface BulkImportRequest {
  cliente: string;
  tramos: TramoData[];
  reutilizarDistancias?: boolean;
  actualizarExistentes?: boolean;
}

/**
 * Interface for bulk import result
 */
interface BulkImportResult {
  total: number;
  exitosos: number;
  errores: unknown[];
  tramosCreados: number;
  tramosActualizados: number;
}

/**
 * Crea múltiples tramos en una sola operación con procesamiento por lotes
 *
 * @async
 * @function bulkCreateTramos
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.body - Datos de la importación masiva
 * @param {string} req.body.cliente - ID del cliente
 * @param {Array} req.body.tramos - Array de tramos a crear
 * @param {boolean} [req.body.reutilizarDistancias=true] - Si reutilizar distancias calculadas
 * @param {boolean} [req.body.actualizarExistentes=false] - Si actualizar tramos existentes
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Resultado de la importación masiva
 * @throws {Error} Error 400 si faltan datos, 500 si hay error del servidor
 */
// eslint-disable-next-line max-lines-per-function
async function bulkCreateTramos(
  req: Request<object, ApiResponse<BulkImportResult>, BulkImportRequest>,
  res: Response<ApiResponse<BulkImportResult>>
): Promise<void> {
  try {
    const { cliente, tramos, reutilizarDistancias = true, actualizarExistentes = false } = req.body;

    if (!cliente || !tramos || !Array.isArray(tramos)) {
      res.status(400).json({
        success: false,
        message: 'Se requiere cliente y un array de tramos',
      });
      return;
    }

    logger.debug(`Procesando ${tramos.length} tramos para cliente ${cliente}`);
    logger.debug(
      `Opciones: reutilizarDistancias=${reutilizarDistancias}, actualizarExistentes=${actualizarExistentes}`
    );

    const BATCH_SIZE = 50;
    const batches = [];

    for (let i = 0; i < tramos.length; i += BATCH_SIZE) {
      batches.push(tramos.slice(i, i + BATCH_SIZE));
    }

    logger.debug(
      `Dividiendo ${tramos.length} tramos en ${batches.length} lotes de máximo ${BATCH_SIZE} tramos`
    );

    const resultadosConsolidados: BulkImportResult = {
      total: tramos.length,
      exitosos: 0,
      errores: [],
      tramosCreados: 0,
      tramosActualizados: 0,
    };

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      try {
        logger.debug(`Procesando lote ${i + 1} de ${batches.length} (${batch.length} tramos)`);

        const resultados = await tramoService.bulkImportTramos(
          cliente,
          batch,
          reutilizarDistancias,
          actualizarExistentes
        );

        resultadosConsolidados.exitosos += resultados.exitosos;
        resultadosConsolidados.tramosCreados += resultados.tramosCreados;
        resultadosConsolidados.tramosActualizados += resultados.tramosActualizados;

        const erroresConLote = resultados.errores.map((error) => ({
          ...error,
          lote: i + 1,
        }));

        resultadosConsolidados.errores.push(...erroresConLote);

        logger.debug(
          `Lote ${i + 1} procesado: ${resultados.exitosos} exitosos, ${resultados.errores.length} errores`
        );
      } catch (error: unknown) {
        logger.error(`Error procesando lote ${i + 1}:`, error);

        resultadosConsolidados.errores.push({
          lote: i + 1,
          error: `Error procesando lote: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    logger.info(
      `Importación masiva completada para cliente ${cliente}: ${resultadosConsolidados.exitosos} exitosos, ${resultadosConsolidados.errores.length} errores.`
    );
    res.status(200).json({
      success: true,
      message: `Proceso completado: ${resultadosConsolidados.exitosos} exitosos, ${resultadosConsolidados.errores.length} errores.`,
      data: resultadosConsolidados,
    });
  } catch (error: unknown) {
    logger.error('Error general en bulkCreateTramos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor durante la importación masiva',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export default bulkCreateTramos;
