/**
 * @module services/tramo/TramoBulkOperations
 * @description Operaciones complejas de creación masiva de tramos
 */

import mongoose from 'mongoose';
import Tramo from '../../models/Tramo';
import logger from '../../utils/logger';
import {
  validateTramosBulkData,
  extractSiteNames,
  findSitesByNames,
  createSiteMap,
  validateSingleTramoData,
  findOriginAndDestination,
  determineClienteId,
  processVigenciaDates,
  validateNumericValues,
  createTarifaHistorica,
  checkConflictosTramoExistente,
  createInsertOperation as createBulkInsertOperation,
  createUpdateOperation as createBulkUpdateOperation,
  TramosBulkData,
  CreateTramosBulkResult,
} from './tramoBulkHelpers';

/**
 * Servicio para operaciones bulk especializadas
 */
export class TramoBulkOperations {
  /**
   * Crea o actualiza tramos masivamente desde la plantilla de corrección
   */
  static async createTramosBulk(
    tramosData: TramosBulkData[],
    options: { session?: mongoose.ClientSession } = {}
  ): Promise<CreateTramosBulkResult> {
    const session = options.session;
    let insertados = 0;
    let actualizados = 0;
    const errores: CreateTramosBulkResult['errores'] = [];
    const operations: unknown[] = [];

    // Validación inicial
    const validation = validateTramosBulkData(tramosData);
    if (!validation.isValid) {
      return {
        success: false,
        insertados,
        actualizados,
        errores: [{ message: validation.error! }],
      };
    }

    logger.info('Iniciando createTramosBulk', { count: tramosData.length });

    try {
      // Preparar datos
      const preparationResult = await this.prepareBulkData(tramosData, session, errores);
      if (!preparationResult) {
        return { success: false, insertados, actualizados, errores };
      }

      const { sitiosPorNombre, tramosPorOrigenDestino } = preparationResult;

      // Procesar cada tramo
      for (const [index, tramoData] of tramosData.entries()) {
        const result = this.processSingleTramoForBulk({
          index,
          tramoData,
          sitiosPorNombre,
          tramosPorOrigenDestino,
          errores,
        });
        if (result) {
          operations.push(result);
        }
      }

      // Ejecutar operaciones
      const executionResult = await this.executeBulkOperations(operations, session, errores);
      insertados = executionResult.insertados;
      actualizados = executionResult.actualizados;
    } catch (error) {
      logger.error('Error en createTramosBulk', error);
      errores.push({ message: `Error general: ${(error as Error).message}` });
    }

    return {
      success: errores.length === 0,
      insertados,
      actualizados,
      errores,
    };
  }

  /**
   * Prepara datos para operación bulk
   */
  private static async prepareBulkData(
    tramosData: TramosBulkData[],
    session?: mongoose.ClientSession,
    errores: CreateTramosBulkResult['errores'] = []
  ): Promise<{
    sitiosPorNombre: Map<string, unknown>;
    tramosPorOrigenDestino: Map<string, unknown>;
  } | null> {
    try {
      // Extraer nombres de sitios
      const sitiosNecesarios = extractSiteNames(tramosData);

      // Buscar sitios
      const sitios = await findSitesByNames(sitiosNecesarios, session);
      const sitiosPorNombre = createSiteMap(sitios);

      logger.debug(
        `Sitios encontrados: ${sitiosPorNombre.size} de ${sitiosNecesarios.length} necesarios`
      );

      // Buscar tramos existentes
      const tramosPorOrigenDestino = await this.findExistingTramos(
        tramosData,
        sitiosPorNombre,
        session
      );

      return { sitiosPorNombre, tramosPorOrigenDestino };
    } catch (error) {
      logger.error('Error preparando datos bulk', error);
      errores.push({ message: `Error preparando datos: ${(error as Error).message}` });
      return null;
    }
  }

  /**
   * Encuentra tramos existentes
   */
  private static async findExistingTramos(
    tramosData: TramosBulkData[],
    sitiosPorNombre: Map<string, unknown>,
    session?: mongoose.ClientSession
  ): Promise<Map<string, unknown>> {
    const origenesDest: Array<{ origen: unknown; destino: unknown }> = [];
    const clienteIds = new Set();

    // Construir pares origen-destino
    for (const tramo of tramosData) {
      const { origen, destino } = findOriginAndDestination(tramo, sitiosPorNombre);

      if (origen && destino) {
        origenesDest.push({ origen: origen._id, destino: destino._id });
        const clienteId = determineClienteId(origen, destino);
        if (clienteId) clienteIds.add(clienteId.toString());
      }
    }

    // Buscar tramos existentes
    const tramosExistentes = await Tramo.find({
      $or: origenesDest.map((par) => ({
        origen: par.origen,
        destino: par.destino,
      })),
      cliente: { $in: [...clienteIds] },
    })
      .session(session || null)
      .lean();

    // Crear mapa
    const tramosPorOrigenDestino = new Map();
    tramosExistentes.forEach((tramo) => {
      const tramoTyped = tramo as { origen: unknown; destino: unknown; cliente: unknown };
      const key = `${tramoTyped.origen.toString()}-${tramoTyped.destino.toString()}-${tramoTyped.cliente.toString()}`;
      tramosPorOrigenDestino.set(key, tramo);
    });

    logger.debug(`Tramos existentes encontrados: ${tramosPorOrigenDestino.size}`);
    return tramosPorOrigenDestino;
  }

  /**
   * Valida los datos básicos del tramo
   */
  private static validateTramoBasicData(config: {
    index: number;
    tramoData: TramosBulkData;
    errores: CreateTramosBulkResult['errores'];
  }): boolean {
    const { index, tramoData, errores } = config;

    const validationError = validateSingleTramoData(tramoData);
    if (validationError) {
      errores.push({ index, message: validationError, data: tramoData });
      return false;
    }
    return true;
  }

  /**
   * Busca y valida los sitios origen y destino
   */
  private static findAndValidateSites(config: {
    index: number;
    tramoData: TramosBulkData;
    sitiosPorNombre: Map<string, unknown>;
    errores: CreateTramosBulkResult['errores'];
  }): { origen: unknown; destino: unknown } | null {
    const { index, tramoData, sitiosPorNombre, errores } = config;

    const { origen, destino, errors } = findOriginAndDestination(tramoData, sitiosPorNombre);
    if (errors.length > 0) {
      errores.push({ index, message: errors[0], data: tramoData });
      return null;
    }
    return { origen: origen!, destino: destino! };
  }

  /**
   * Valida y determina el cliente para el tramo
   */
  private static validateClienteForTramo(config: {
    index: number;
    tramoData: TramosBulkData;
    origen: unknown;
    destino: unknown;
    errores: CreateTramosBulkResult['errores'];
  }): string | null {
    const { index, tramoData, origen, destino, errores } = config;

    const clienteId = determineClienteId(origen, destino);
    if (!clienteId) {
      errores.push({
        index,
        message: 'No se pudo determinar el cliente para el tramo',
        data: tramoData,
      });
      return null;
    }
    return clienteId;
  }

  /**
   * Procesa las fechas y valores del tramo
   */
  private static processTramoDateAndValues(config: {
    index: number;
    tramoData: TramosBulkData;
    errores: CreateTramosBulkResult['errores'];
  }): {
    fechas: { fechaDesde: Date; fechaHasta: Date };
    values: { valorTarifa: number; valorPeaje: number };
  } | null {
    const { index, tramoData, errores } = config;

    // Procesar fechas
    const fechasResult = processVigenciaDates(tramoData);
    if (fechasResult.error) {
      errores.push({ index, message: fechasResult.error, data: tramoData });
      return null;
    }

    // Validar valores
    const valuesResult = validateNumericValues(tramoData);
    if (valuesResult.error) {
      errores.push({ index, message: valuesResult.error, data: tramoData });
      return null;
    }

    return {
      fechas: fechasResult.fechas!,
      values: valuesResult.values!,
    };
  }

  /**
   * Procesa un tramo individual para operación bulk
   */
  public static processSingleTramoForBulk(config: {
    index: number;
    tramoData: TramosBulkData;
    sitiosPorNombre: Map<string, unknown>;
    tramosPorOrigenDestino: Map<string, unknown>;
    errores: CreateTramosBulkResult['errores'];
  }): unknown | null {
    const { index, tramoData, sitiosPorNombre, tramosPorOrigenDestino, errores } = config;

    try {
      // Validar campos requeridos
      if (!this.validateTramoBasicData({ index, tramoData, errores })) {
        return null;
      }

      // Buscar sitios
      const sitesResult = this.findAndValidateSites({ index, tramoData, sitiosPorNombre, errores });
      if (!sitesResult) return null;
      const { origen, destino } = sitesResult;

      // Determinar cliente
      const clienteId = this.validateClienteForTramo({
        index,
        tramoData,
        origen,
        destino,
        errores,
      });
      if (!clienteId) return null;

      // Procesar fechas y valores
      const processResult = this.processTramoDateAndValues({ index, tramoData, errores });
      if (!processResult) return null;
      const { fechas, values } = processResult;

      // Crear tarifa
      const nuevaTarifa = createTarifaHistorica({
        tramoData,
        fechaDesde: fechas.fechaDesde,
        fechaHasta: fechas.fechaHasta,
        valorTarifa: values.valorTarifa,
        valorPeaje: values.valorPeaje,
      });

      // Verificar si existe el tramo
      const tramoKey = `${(origen as { _id: unknown })._id.toString()}-${(destino as { _id: unknown })._id.toString()}-${clienteId.toString()}`;
      const tramoExistente = tramosPorOrigenDestino.get(tramoKey) as
        | { tarifasHistoricas?: unknown[] }
        | undefined;

      if (tramoExistente) {
        // Verificar conflictos
        if (checkConflictosTramoExistente(tramoExistente, nuevaTarifa)) {
          errores.push({
            index,
            message: 'Conflicto de fechas con tarifa existente del mismo tipo',
            data: tramoData,
          });
          return null;
        }
        return createBulkUpdateOperation(tramoExistente, nuevaTarifa);
      } else {
        return createBulkInsertOperation(origen, destino, clienteId, nuevaTarifa);
      }
    } catch (error) {
      logger.error(`Error procesando tramo en índice ${index}`, error);
      errores.push({
        index,
        message: `Error procesando tramo: ${(error as Error).message}`,
        data: tramoData,
      });
      return null;
    }
  }

  /**
   * Ejecuta operaciones bulk
   */
  private static async executeBulkOperations(
    operations: unknown[],
    session?: mongoose.ClientSession,
    errores: CreateTramosBulkResult['errores'] = []
  ): Promise<{ insertados: number; actualizados: number }> {
    if (operations.length === 0) {
      logger.info('No se prepararon operaciones válidas');
      return { insertados: 0, actualizados: 0 };
    }

    try {
      const result = await Tramo.bulkWrite(operations, { session, ordered: false });
      logger.info('Operaciones bulk completadas', {
        insertados: result.insertedCount,
        actualizados: result.modifiedCount,
      });

      // Manejar errores de escritura
      if (result.hasWriteErrors && result.hasWriteErrors()) {
        const writeErrors = result.getWriteErrors();
        logger.warn(`${writeErrors.length} errores durante bulkWrite`);

        writeErrors.forEach((err) => {
          errores.push({
            index: 'N/A',
            message: `Error en operación: ${err.errmsg}`,
            code: err.code,
            data: 'No disponible',
          });
        });
      }

      return { insertados: result.insertedCount, actualizados: result.modifiedCount };
    } catch (error) {
      logger.error('Error en executeBulkOperations', error);
      errores.push({ message: `Error durante bulkWrite: ${(error as Error).message}` });
      return { insertados: 0, actualizados: 0 };
    }
  }
}
