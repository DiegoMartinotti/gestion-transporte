/**
 * @module services/tramo/TramoBulkImportHelpers
 * @description Helpers para importación masiva de tramos
 */

import mongoose, { AnyBulkWriteOperation } from 'mongoose';
import Tramo, { ITramo } from '../../models/Tramo';
import logger from '../../utils/logger';
import { buildSiteMaps, ProcessOptions } from './tramoProcessingHelpers';

/**
 * Interfaz para resultado de importación bulk
 */
export interface BulkImportResult {
  total: number;
  exitosos: number;
  errores: Array<{
    tramo: number;
    origen: string;
    destino: string;
    error: string;
  }>;
  tramosCreados: number;
  tramosActualizados: number;
}

/**
 * Interfaz para configuración de importación bulk
 */
export interface BulkImportConfig {
  clienteId: string;
  tramosData: unknown[];
  reutilizarDistancias: boolean;
  actualizarExistentes?: boolean;
}

/**
 * Prepara el entorno para importación masiva
 */
export async function prepareBulkImportEnvironment(config: BulkImportConfig): Promise<{
  siteMaps: { sitesMap: Map<string, unknown>; sitesMapByCode: Map<string, unknown> };
  mapaTramos: Map<string, unknown>;
  options: ProcessOptions;
}> {
  const { clienteId, reutilizarDistancias, actualizarExistentes } = config;

  // Construir mapas de sitios para búsqueda rápida
  const siteMaps = await buildSiteMaps();

  // Cargar todos los tramos existentes para este cliente
  const tramosExistentes = await Tramo.find({
    cliente: clienteId,
  });

  logger.debug(
    `Se encontraron ${tramosExistentes.length} tramos existentes para el cliente ${clienteId}`
  );

  // Crear un mapa para búsqueda rápida de tramos existentes
  const mapaTramos = new Map();
  tramosExistentes.forEach((tramo) => {
    const origenId = String(tramo.origen);
    const destinoId = String(tramo.destino);
    const key = `${origenId}-${destinoId}-${clienteId}`;
    if (!mapaTramos.has(key)) {
      mapaTramos.set(key, tramo);
    } else {
      logger.warn(`Se encontró un tramo duplicado en la base de datos para la clave: ${key}`);
    }
  });

  // Opciones de procesamiento
  const options: ProcessOptions = {
    clienteId,
    reutilizarDistancias,
    actualizarExistentes,
    sitesMap: siteMaps.sitesMap,
    sitesMapByCode: siteMaps.sitesMapByCode,
    mapaTramos,
  };

  return { siteMaps, mapaTramos, options };
}

/**
 * Ejecuta operaciones de escritura masiva con transacción
 */
export async function executeBulkWriteOperations(
  operacionesInsert: AnyBulkWriteOperation<ITramo>[],
  operacionesUpdate: AnyBulkWriteOperation<ITramo>[],
  clienteId: string
): Promise<{ success: boolean; insertedCount: number; modifiedCount: number }> {
  const session = await mongoose.startSession();

  try {
    let insertedCount = 0;
    let modifiedCount = 0;

    await session.withTransaction(async () => {
      // Ejecutar operaciones en lotes
      if (operacionesInsert.length > 0) {
        const insertResult = await Tramo.bulkWrite(operacionesInsert, { session });
        insertedCount = insertResult.insertedCount;
        logger.debug(`Insertados ${operacionesInsert.length} tramos nuevos`);
      }

      if (operacionesUpdate.length > 0) {
        const updateResult = await Tramo.bulkWrite(operacionesUpdate, { session });
        modifiedCount = updateResult.modifiedCount;
        logger.debug(`Actualizados ${operacionesUpdate.length} tramos existentes`);
      }
    });

    logger.info(
      `Importación masiva completada para cliente ${clienteId}: ${insertedCount + modifiedCount} exitosos.`
    );

    return { success: true, insertedCount, modifiedCount };
  } catch (transactionError) {
    logger.error('Error en la transacción de importación:', transactionError);
    throw transactionError;
  } finally {
    session.endSession();
  }
}

/**
 * Inicializa resultado de importación bulk
 */
export function initializeBulkImportResult(total: number): BulkImportResult {
  return {
    total,
    exitosos: 0,
    errores: [],
    tramosCreados: 0,
    tramosActualizados: 0,
  };
}
