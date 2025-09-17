/**
 * @module services/tramo/TramoService
 * @description Servicio para gestión de tramos extendiendo BaseService
 * Mantiene lógica específica compleja de tarifas históricas mientras usa funcionalidad común
 */

import { BaseService, PaginationOptions, TransactionOptions } from '../BaseService';
import Tramo, { ITramo } from '../../models/Tramo';
import logger from '../../utils/logger';
import mongoose, { AnyBulkWriteOperation } from 'mongoose';

// Importar helpers refactorizados
import {
  validateRequiredFields,
  validateReferences,
  validateTarifasHistoricas,
  RequiredTramoFields
} from './tramoValidationHelpers';
import {
  validateBasicTramoData,
  processFechasVigencia,
  createNuevaTarifa,
  checkTarifaConflicts,
  calculateDistanceIfNeeded,
  createInsertOperation,
  createUpdateOperation,
  ProcessOptions,
  ProcessResult,
  TramoData,
} from './tramoProcessingHelpers';
import {
  getTramosActuales,
  getTramosHistoricos,
  TramoResult
} from './tramoQueryHelpers';
import {
  validateTramosBulkData,
  extractSiteNames,
  findSitesByNames,
  createSiteMap,
  findOriginAndDestination,
  determineClienteId,
  TramosBulkData,
  CreateTramosBulkResult
} from './tramoBulkHelpers';
import { TramoBulkOperations } from './tramoBulkOperations';
import {
  prepareBulkImportEnvironment,
  executeBulkWriteOperations,
  initializeBulkImportResult,
  BulkImportConfig
} from './tramoBulkImportHelpers';

// ==================== INTERFACES ESPECÍFICAS ====================


// ==================== CLASE TRAMO SERVICE ====================

/**
 * Servicio de tramos que extiende BaseService
 * Proporciona funcionalidad CRUD común más métodos específicos de tramos
 */
class TramoService extends BaseService<ITramo> {
  constructor() {
    super(Tramo);
  }

  // ==================== HOOKS ABSTRACTOS IMPLEMENTADOS ====================

  /**
   * Validaciones específicas para datos de tramos
   */
  protected async validateData(data: Partial<ITramo>): Promise<void> {
    const requiredFields: RequiredTramoFields = {
      origen: data.origen,
      destino: data.destino,
      cliente: data.cliente,
      tarifasHistoricas: data.tarifasHistoricas
    };

    // Validar campos requeridos
    validateRequiredFields(requiredFields);

    // Validar que las referencias existan
    await validateReferences(requiredFields);

    // Validar tarifas históricas si están presentes
    if (data.tarifasHistoricas && data.tarifasHistoricas.length > 0) {
      validateTarifasHistoricas(data.tarifasHistoricas);
    }
  }


  /**
   * Hook después de crear - log adicional para tramos
   */
  protected async afterCreate(tramo: ITramo, _options: TransactionOptions = {}): Promise<void> {
    this.logInfo('Tramo creado exitosamente', {
      tramoId: tramo._id,
      origen: tramo.origen,
      destino: tramo.destino,
      cliente: tramo.cliente,
      tarifasCount: tramo.tarifasHistoricas?.length || 0
    });
  }

  /**
   * Hook después de actualizar - log adicional para tramos
   */
  protected async afterUpdate(tramo: ITramo, _options: TransactionOptions = {}): Promise<void> {
    this.logInfo('Tramo actualizado exitosamente', {
      tramoId: tramo._id,
      tarifasCount: tramo.tarifasHistoricas?.length || 0
    });
  }

  /**
   * Hook antes de eliminar - verificar dependencias
   */
  protected async beforeDelete(tramo: ITramo, _options: TransactionOptions = {}): Promise<void> {
    // Aquí se pueden agregar validaciones adicionales antes de eliminar
    // Por ejemplo, verificar si el tramo está siendo usado en viajes
    this.logInfo('Preparando eliminación de tramo', {
      tramoId: tramo._id,
      origen: tramo.origen,
      destino: tramo.destino
    });
  }

  // ==================== MÉTODOS ESPECÍFICOS DE TRAMOS (PRESERVADOS) ====================


  /**
   * Procesa una fila de datos de tramo para importación
   */
  private async processTramoRow(tramoData: TramoData, indiceTramo: number, options: ProcessOptions): Promise<ProcessResult> {
    const { clienteId, reutilizarDistancias, sitesMap, mapaTramos } = options;

    try {
      // Validación básica de datos
      const basicError = validateBasicTramoData(tramoData);
      if (basicError) {
        return { status: 'error', error: basicError };
      }

      // Normalizar tipo de tramo
      tramoData.tarifaHistorica.tipo = tramoData.tarifaHistorica.tipo?.toUpperCase() || 'TRMC';

      // Procesar fechas
      const fechasResult = processFechasVigencia(tramoData);
      if (typeof fechasResult === 'string') {
        return { status: 'error', error: fechasResult };
      }

      const { fechaDesde, fechaHasta } = fechasResult;
      const origenIdStr = String(tramoData.origen);
      const destinoIdStr = String(tramoData.destino);
      const tramoKey = `${origenIdStr}-${destinoIdStr}-${clienteId}`;
      const tramoExistente = mapaTramos.get(tramoKey) as { _id: unknown; tarifasHistoricas: unknown[] } | undefined;

      // Crear la nueva tarifa
      const nuevaTarifa = createNuevaTarifa(tramoData, fechaDesde, fechaHasta);

      // Caso 1: El tramo ya existe
      if (tramoExistente) {
        return this.handleExistingTramo({
          tramoExistente,
          nuevaTarifa,
          tramoData,
          indiceTramo,
          origenIdStr,
          destinoIdStr
        });
      }

      // Caso 2: El tramo no existe
      return await this.handleNewTramo({
        tramoData,
        clienteId,
        reutilizarDistancias,
        sitesMap,
        nuevaTarifa,
        indiceTramo,
        origenIdStr,
        destinoIdStr
      });

    } catch (error) {
      return {
        status: 'error',
        error: (error as Error).message || 'Error desconocido en procesamiento',
        tramoInfo: {
          origenNombre: tramoData.origenNombre || tramoData.origen,
          destinoNombre: tramoData.destinoNombre || tramoData.destino
        }
      };
    }
  }

  /**
   * Maneja tramo existente verificando conflictos
   */
  private handleExistingTramo(config: {
    tramoExistente: { _id: unknown; tarifasHistoricas: unknown[] };
    nuevaTarifa: { tipo: string; metodoCalculo: string; valor: number; valorPeaje: number; vigenciaDesde: Date; vigenciaHasta: Date };
    tramoData: TramoData;
    indiceTramo: number;
    origenIdStr: string;
    destinoIdStr: string;
  }): ProcessResult {
    const { tramoExistente, nuevaTarifa, tramoData, indiceTramo, origenIdStr, destinoIdStr } = config;

    logger.debug(`Tramo #${indiceTramo}: Encontrado tramo existente para ${tramoData.origenNombre || origenIdStr} → ${tramoData.destinoNombre || destinoIdStr}`);

    const conflict = checkTarifaConflicts(tramoExistente, nuevaTarifa);

    if (!conflict.hasConflict) {
      return createUpdateOperation({
        tramoExistente,
        nuevaTarifa,
        tramoData,
        origenIdStr,
        destinoIdStr
      });
    }

    logger.error(`Tramo #${indiceTramo}: ${conflict.error}`);
    return {
      status: 'error',
      error: conflict.error || 'Error desconocido',
      tramoInfo: {
        origenNombre: tramoData.origenNombre || origenIdStr,
        destinoNombre: tramoData.destinoNombre || destinoIdStr
      }
    };
  }

  /**
   * Maneja creación de nuevo tramo
   */
  private async handleNewTramo(config: {
    tramoData: TramoData;
    clienteId: string;
    reutilizarDistancias: boolean;
    sitesMap: Map<string, unknown>;
    nuevaTarifa: { tipo: string; metodoCalculo: string; valor: number; valorPeaje: number; vigenciaDesde: Date; vigenciaHasta: Date };
    indiceTramo: number;
    origenIdStr: string;
    destinoIdStr: string;
  }): Promise<ProcessResult> {
    const { tramoData, clienteId, reutilizarDistancias, sitesMap, nuevaTarifa, indiceTramo, origenIdStr, destinoIdStr } = config;

    logger.debug(`Tramo #${indiceTramo}: No se encontró tramo existente. Creando nuevo...`);

    const origenSite = sitesMap.get(origenIdStr) as { location?: { coordinates?: number[] } } | undefined;
    const destinoSite = sitesMap.get(destinoIdStr) as { location?: { coordinates?: number[] } } | undefined;

    const nuevoTramo = {
      _id: new mongoose.Types.ObjectId(),
      origen: tramoData.origen,
      destino: tramoData.destino,
      cliente: clienteId,
      distancia: reutilizarDistancias ? (tramoData.distanciaPreCalculada || 0) : 0,
      tarifasHistoricas: [nuevaTarifa]
    };

    // Calcular distancia si es necesario
    nuevoTramo.distancia = await calculateDistanceIfNeeded(nuevoTramo, origenSite, destinoSite, indiceTramo);

    return createInsertOperation({
      tramoData,
      clienteId,
      distancia: nuevoTramo.distancia,
      nuevaTarifa,
      origenIdStr,
      destinoIdStr
    });
  }

  /**
   * Importación masiva de tramos
   * @param clienteId - ID del cliente
   * @param tramosData - Array de objetos con datos de tramos
   * @param reutilizarDistancias - Indica si se deben reutilizar distancias pre-calculadas
   * @param actualizarExistentes - Indica si se deben actualizar tramos existentes
   * @returns Resultado de la operación con tramos creados y errores
   * @throws Error si hay problemas en la importación
   */
  async bulkImportTramos(
    clienteId: string,
    tramosData: TramoData[],
    reutilizarDistancias = true,
    actualizarExistentes = false
  ): Promise<import('./tramoBulkImportHelpers').BulkImportResult> {
    logger.debug(`Procesando ${tramosData.length} tramos para cliente ${clienteId}`);
    logger.debug(`Opciones: reutilizarDistancias=${reutilizarDistancias}, actualizarExistentes=${actualizarExistentes}`);

    const resultados = initializeBulkImportResult(tramosData.length);

    try {
      const config: BulkImportConfig = {
        clienteId,
        tramosData,
        reutilizarDistancias,
        actualizarExistentes
      };

      const { options } = await prepareBulkImportEnvironment(config);
      const { operacionesInsert, operacionesUpdate } = await this.processAllTramos(tramosData, options, resultados);
      const executionResult = await executeBulkWriteOperations(operacionesInsert, operacionesUpdate, clienteId);

      resultados.tramosCreados = executionResult.insertedCount;
      resultados.tramosActualizados = executionResult.modifiedCount;
      resultados.exitosos = executionResult.insertedCount + executionResult.modifiedCount;

      return resultados;
    } catch (error) {
      logger.error('Error general en bulkImportTramos:', error);
      throw error;
    }
  }

  /**
   * Procesa todos los tramos para importación
   */
  private async processAllTramos(
    tramosData: TramoData[],
    options: ProcessOptions,
    resultados: import('./tramoBulkImportHelpers').BulkImportResult
  ): Promise<{ operacionesInsert: AnyBulkWriteOperation<ITramo>[]; operacionesUpdate: AnyBulkWriteOperation<ITramo>[] }> {
    const operacionesInsert: AnyBulkWriteOperation<ITramo>[] = [];
    const operacionesUpdate: AnyBulkWriteOperation<ITramo>[] = [];

    for (let i = 0; i < tramosData.length; i++) {
      const tramoData = tramosData[i];
      const indiceTramo = i + 1;

      const resultado = await this.processTramoRow(tramoData, indiceTramo, options);

      this.processTramoResult({
        resultado,
        indiceTramo,
        tramoData,
        operacionesInsert,
        operacionesUpdate,
        resultados
      });
    }

    return { operacionesInsert, operacionesUpdate };
  }

  /**
   * Procesa resultado de procesamiento de tramo
   */
  private processTramoResult(
    config: {
      resultado: ProcessResult;
      indiceTramo: number;
      tramoData: TramoData;
      operacionesInsert: unknown[];
      operacionesUpdate: unknown[];
      resultados: import('./tramoBulkImportHelpers').BulkImportResult;
    }
  ): void {
    const { resultado, indiceTramo, tramoData, operacionesInsert, operacionesUpdate, resultados } = config;

    if (resultado.status === 'insert' && resultado.operation) {
      operacionesInsert.push(resultado.operation);
      resultados.tramosCreados++;
      resultados.exitosos++;
    } else if (resultado.status === 'update' && resultado.operation) {
      operacionesUpdate.push(resultado.operation);
      resultados.tramosActualizados++;
      resultados.exitosos++;
    } else if (resultado.status === 'error') {
      resultados.errores.push({
        tramo: indiceTramo,
        origen: resultado.tramoInfo?.origenNombre || tramoData.origen,
        destino: resultado.tramoInfo?.destinoNombre || tramoData.destino,
        error: resultado.error || 'Error desconocido'
      });
    }
  }

  /**
   * Obtiene los tramos activos para un cliente específico
   */
  async getTramosByCliente(clienteId: string, opciones: { desde?: string; hasta?: string; incluirHistoricos?: string } = {}): Promise<TramoResult> {
    const { desde, hasta, incluirHistoricos } = opciones;

    logger.debug(`Buscando tramos para cliente: ${clienteId}`);
    logger.debug(`Parámetros de filtro: desde=${desde}, hasta=${hasta}, incluirHistoricos=${incluirHistoricos}`);

    // Obtener todos los tramos del cliente
    const todosLosTramos = await Tramo.find({ cliente: clienteId })
        .populate('origen', 'Site location')
        .populate('destino', 'Site location')
        .lean();  // Usar lean() para mejor rendimiento

    logger.debug(`Encontrados ${todosLosTramos.length} tramos totales para cliente ${clienteId}`);

    // Si se solicitan tramos históricos con filtro de fecha
    if (desde && hasta && incluirHistoricos === 'true') {
        return getTramosHistoricos(todosLosTramos, desde, hasta);
    }

    // Caso default: obtener tramos actuales
    return getTramosActuales(todosLosTramos);
  }



  /**
   * Obtiene todas las distancias calculadas de tramos existentes
   * @returns Lista de distancias calculadas
   */
  async getDistanciasCalculadas(): Promise<unknown[]> {
    // Obtener todas las distancias calculadas de tramos existentes
    const distancias = await Tramo.aggregate([
        // Filtrar solo tramos con distancia calculada
        { $match: { distancia: { $gt: 0 } } },
        // Agrupar por origen-destino y tomar la distancia más reciente
        {
            $group: {
                _id: { origen: "$origen", destino: "$destino" },
                distancia: { $first: "$distancia" },
                updatedAt: { $max: "$updatedAt" }
            }
        },
        // Formatear la salida
        {
            $project: {
                _id: 0,
                origen: { $toString: "$_id.origen" },
                destino: { $toString: "$_id.destino" },
                distancia: 1
            }
        }
    ]);

    logger.debug(`Se encontraron ${distancias.length} distancias pre-calculadas`);
    return distancias;
  }

  /**
   * Crea o actualiza tramos masivamente desde la plantilla de corrección
   */
  async createTramosBulk(tramosData: TramosBulkData[], options: { session?: mongoose.ClientSession } = {}): Promise<CreateTramosBulkResult> {
    const session = options.session;
    let insertados = 0;
    let actualizados = 0;
    const errores: CreateTramosBulkResult['errores'] = [];
    const operations: unknown[] = [];

    // Validación inicial
    const validation = validateTramosBulkData(tramosData);
    if (!validation.isValid) {
        return { success: false, insertados, actualizados, errores: [{ message: validation.error! }] };
    }

    this.logOperation('createTramosBulk', { count: tramosData.length });

    try {
      // Preparar datos
      const preparationResult = await this.prepareBulkData(tramosData, session, errores);
      if (!preparationResult) {
        return { success: false, insertados, actualizados, errores };
      }

      const { sitiosPorNombre, tramosPorOrigenDestino } = preparationResult;

      // Procesar cada tramo
      for (const [index, tramoData] of tramosData.entries()) {
        const result = TramoBulkOperations.processSingleTramoForBulk({
          index,
          tramoData,
          sitiosPorNombre,
          tramosPorOrigenDestino,
          errores
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
      this.logFailure('createTramosBulk', error);
      errores.push({ message: `Error general: ${(error as Error).message}` });
    }

    return {
        success: errores.length === 0,
        insertados,
        actualizados,
        errores
    };
  }

  /**
   * Prepara datos para operación bulk
   */
  private async prepareBulkData(
    tramosData: TramosBulkData[],
    session?: mongoose.ClientSession,
    errores: CreateTramosBulkResult['errores'] = []
  ): Promise<{ sitiosPorNombre: Map<string, unknown>; tramosPorOrigenDestino: Map<string, unknown> } | null> {
    try {
      // Extraer nombres de sitios
      const sitiosNecesarios = extractSiteNames(tramosData);

      // Buscar sitios
      const sitios = await findSitesByNames(sitiosNecesarios, session);
      const sitiosPorNombre = createSiteMap(sitios);

      this.logDebug(`Sitios encontrados: ${sitiosPorNombre.size} de ${sitiosNecesarios.length} necesarios`);

      // Buscar tramos existentes
      const tramosPorOrigenDestino = await this.findExistingTramos(tramosData, sitiosPorNombre, session);

      return { sitiosPorNombre, tramosPorOrigenDestino };
    } catch (error) {
      this.logError('Error preparando datos bulk', error);
      errores.push({ message: `Error preparando datos: ${(error as Error).message}` });
      return null;
    }
  }

  /**
   * Encuentra tramos existentes
   */
  private async findExistingTramos(
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
      $or: origenesDest.map(par => ({
        origen: par.origen,
        destino: par.destino
      })),
      cliente: { $in: [...clienteIds] }
    }).session(session || null).lean();

    // Crear mapa
    const tramosPorOrigenDestino = new Map();
    tramosExistentes.forEach(tramo => {
      const key = `${(tramo as { origen: unknown; destino: unknown; cliente: unknown }).origen.toString()}-${(tramo as { origen: unknown; destino: unknown; cliente: unknown }).destino.toString()}-${(tramo as { origen: unknown; destino: unknown; cliente: unknown }).cliente.toString()}`;
      tramosPorOrigenDestino.set(key, tramo);
    });

    this.logDebug(`Tramos existentes encontrados: ${tramosPorOrigenDestino.size}`);
    return tramosPorOrigenDestino;
  }


  /**
   * Ejecuta operaciones bulk
   */
  private async executeBulkOperations(
    operations: unknown[],
    session?: mongoose.ClientSession,
    errores: CreateTramosBulkResult['errores'] = []
  ): Promise<{ insertados: number; actualizados: number }> {
    if (operations.length === 0) {
      this.logInfo('No se prepararon operaciones válidas');
      return { insertados: 0, actualizados: 0 };
    }

    try {
      const result = await Tramo.bulkWrite(operations, { session, ordered: false });
      this.logSuccess('createTramosBulk', { insertados: result.insertedCount, actualizados: result.modifiedCount });

      // Manejar errores de escritura
      if (result.hasWriteErrors && result.hasWriteErrors()) {
        const writeErrors = result.getWriteErrors();
        this.logWarn(`${writeErrors.length} errores durante bulkWrite`);

        writeErrors.forEach(err => {
          errores.push({
            index: 'N/A',
            message: `Error en operación: ${err.errmsg}`,
            code: err.code,
            data: 'No disponible'
          });
        });
      }

      return { insertados: result.insertedCount, actualizados: result.modifiedCount };
    } catch (error) {
      this.logFailure('executeBulkOperations', error);
      errores.push({ message: `Error durante bulkWrite: ${(error as Error).message}` });
      return { insertados: 0, actualizados: 0 };
    }
  }

  /**
   * Obtiene el tipo de tramo con la tarifa más alta para una combinación origen-destino-cliente
   */
  async getTipoTramoConTarifaMasAlta(
    origenId: string,
    destinoId: string,
    clienteId: string,
    fecha: Date = new Date()
  ): Promise<'TRMC' | 'TRMI'> {
    try {
      logger.debug(`Buscando tipo de tramo con tarifa más alta para origen: ${origenId}, destino: ${destinoId}, cliente: ${clienteId}, fecha: ${fecha.toISOString()}`);

      const tramo = await this.findTramoByIds(origenId, destinoId, clienteId);
      if (!tramo) {
        logger.debug('No se encontró tramo. Retornando TRMC por defecto');
        return 'TRMC';
      }

      return this.getTipoTarifaMasAlta(tramo, fecha);
    } catch (error) {
      logger.error(`Error al obtener tipo de tramo con tarifa más alta: ${error}`);
      return 'TRMC';
    }
  }

  /**
   * Busca tramo por IDs
   */
  private async findTramoByIds(origenId: string, destinoId: string, clienteId: string): Promise<{ tarifasHistoricas?: unknown[] } | null> {
    return await Tramo.findOne({
      origen: origenId,
      destino: destinoId,
      cliente: clienteId
    }).lean();
  }

  /**
   * Obtiene tipo de tarifa más alta
   */
  private getTipoTarifaMasAlta(tramo: { tarifasHistoricas?: unknown[] }, fecha: Date): 'TRMC' | 'TRMI' {
    if (!tramo.tarifasHistoricas?.length) {
      logger.debug('Tramo sin tarifas históricas. Retornando TRMC por defecto');
      return 'TRMC';
    }

    // Buscar tarifas vigentes
    const tarifasVigentes = this.filterTarifasVigentes(tramo.tarifasHistoricas, fecha);
    if (tarifasVigentes.length > 0) {
      return this.getTipoTarifaConMayorValor(tarifasVigentes);
    }

    // Buscar la más reciente
    return this.getTipoTarifaMasReciente(tramo.tarifasHistoricas);
  }

  /**
   * Filtra tarifas vigentes para una fecha
   */
  private filterTarifasVigentes(tarifas: unknown[], fecha: Date): unknown[] {
    return tarifas.filter((tarifa: unknown) => {
      if (typeof tarifa === 'object' && tarifa !== null && 'vigenciaDesde' in tarifa && 'vigenciaHasta' in tarifa) {
        return new Date((tarifa as { vigenciaDesde: Date }).vigenciaDesde) <= fecha &&
               new Date((tarifa as { vigenciaHasta: Date }).vigenciaHasta) >= fecha;
      }
      return false;
    });
  }

  /**
   * Obtiene tipo de tarifa con mayor valor
   */
  private getTipoTarifaConMayorValor(tarifas: unknown[]): 'TRMC' | 'TRMI' {
    const tarifaMasAlta = tarifas.reduce((maxTarifa, tarifa) => {
      if (typeof tarifa === 'object' && tarifa !== null && 'valor' in tarifa &&
          typeof maxTarifa === 'object' && maxTarifa !== null && 'valor' in maxTarifa) {
        return (tarifa as { valor: number }).valor > (maxTarifa as { valor: number }).valor ? tarifa : maxTarifa;
      }
      return maxTarifa;
    });

    if (typeof tarifaMasAlta === 'object' && tarifaMasAlta !== null && 'tipo' in tarifaMasAlta) {
      logger.debug(`Tarifa vigente más alta encontrada: tipo=${(tarifaMasAlta as { tipo: string }).tipo}, valor=${(tarifaMasAlta as { valor: number }).valor}`);
      return (tarifaMasAlta as { tipo: 'TRMC' | 'TRMI' }).tipo;
    }

    return 'TRMC';
  }

  /**
   * Obtiene tipo de tarifa más reciente
   */
  private getTipoTarifaMasReciente(tarifas: unknown[]): 'TRMC' | 'TRMI' {
    logger.debug('No hay tarifas vigentes. Buscando la más reciente...');

    const tarifaMasReciente = tarifas
      .filter((tarifa): tarifa is { vigenciaHasta: Date; tipo: string; valor: number } =>
        typeof tarifa === 'object' && tarifa !== null && 'vigenciaHasta' in tarifa && 'tipo' in tarifa
      )
      .sort((a, b) => new Date(b.vigenciaHasta).getTime() - new Date(a.vigenciaHasta).getTime())[0];

    if (tarifaMasReciente) {
      logger.debug(`Usando tarifa más reciente: tipo=${tarifaMasReciente.tipo}, vigenciaHasta=${tarifaMasReciente.vigenciaHasta}`);

      // Buscar tarifa con mayor valor entre las de misma fecha
      const mismaFechaVigencia = tarifas.filter((t): t is { vigenciaHasta: Date; tipo: string; valor: number } =>
        typeof t === 'object' && t !== null && 'vigenciaHasta' in t &&
        new Date((t as { vigenciaHasta: Date }).vigenciaHasta).getTime() === new Date(tarifaMasReciente.vigenciaHasta).getTime()
      );

      if (mismaFechaVigencia.length > 1) {
        const tarifaMasAltaMismaFecha = mismaFechaVigencia.reduce((maxTarifa, tarifa) =>
          tarifa.valor > maxTarifa.valor ? tarifa : maxTarifa
        );
        logger.debug(`Entre tarifas con misma fecha, la más alta es: tipo=${tarifaMasAltaMismaFecha.tipo}, valor=${tarifaMasAltaMismaFecha.valor}`);
        return tarifaMasAltaMismaFecha.tipo as 'TRMC' | 'TRMI';
      }

      return tarifaMasReciente.tipo as 'TRMC' | 'TRMI';
    }

    logger.warn('No se pudo determinar el tipo de tramo. Retornando TRMC por defecto');
    return 'TRMC';
  }
}

// ==================== INSTANCIA SINGLETON ====================

const tramoService = new TramoService();

// ==================== EXPORTS PARA COMPATIBILIDAD ====================

export { TramoService };
export default tramoService;

// Exportar métodos individuales para compatibilidad con controladores existentes
export const bulkImportTramos = (clienteId: string, tramosData: TramoData[], reutilizarDistancias?: boolean, actualizarExistentes?: boolean) => 
  tramoService.bulkImportTramos(clienteId, tramosData, reutilizarDistancias, actualizarExistentes);

export const getTramosByCliente = (clienteId: string, opciones?: { desde?: string; hasta?: string; incluirHistoricos?: string }) => 
  tramoService.getTramosByCliente(clienteId, opciones);

export const getDistanciasCalculadas = () => tramoService.getDistanciasCalculadas();

export const createTramosBulk = (tramosData: TramosBulkData[], options?: { session?: mongoose.ClientSession }) => 
  tramoService.createTramosBulk(tramosData, options);

export const getTipoTramoConTarifaMasAlta = (origenId: string, destinoId: string, clienteId: string, fecha?: Date) => 
  tramoService.getTipoTramoConTarifaMasAlta(origenId, destinoId, clienteId, fecha);

// Métodos CRUD básicos adicionales para compatibilidad
export const getAllTramos = async (opciones?: PaginationOptions<ITramo>) => {
  const result = await tramoService.getAll(opciones);
  // Convertir formato BaseService a formato esperado por controladores
  return {
    tramos: result.data,
    paginacion: result.paginacion
  };
};

export const getTramoById = (id: string) => tramoService.getById(id);
export const createTramo = (data: Partial<ITramo>) => tramoService.create(data);
export const updateTramo = (id: string, data: Partial<ITramo>) => tramoService.update(id, data);
export const deleteTramo = async (id: string) => {
  const result = await tramoService.delete(id);
  // Convertir formato BaseService a formato esperado por controladores
  return { message: result.message || 'Tramo eliminado correctamente' };
};