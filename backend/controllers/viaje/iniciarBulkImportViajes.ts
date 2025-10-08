/* eslint-disable max-lines, max-lines-per-function, max-params */
import { Request, Response } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import mongoose, { Types } from 'mongoose';
import Viaje, { IViaje } from '../../models/Viaje';
import Cliente from '../../models/Cliente';
import Site from '../../models/Site';
import ImportacionTemporal from '../../models/ImportacionTemporal';
import logger from '../../utils/logger';
import ApiResponseClass from '../../utils/ApiResponse';
import * as tramoService from '../../services/tramo/tramoService';

/**
 * Interface for bulk import request
 */
interface BulkImportRequest {
  cliente: string;
  viajes: ViajeImportData[];
  erroresMapeo?: ErrorMapeo[];
  sitesNoEncontrados?: string[];
  totalFilasConErrores?: number;
}

/**
 * Interface for viaje import data
 */
interface ViajeImportData {
  fecha: string;
  origen: string;
  destino: string;
  dt: string;
  cliente?: string;
  tipoTramo?: string;
  peaje?: number;
  tarifa?: number;
  chofer?: string;
  [key: string]: unknown;
}

/**
 * Interface for error mapping
 */
interface ErrorMapeo {
  fila: number;
  error: string;
}

/**
 * Interface for API responses
 */
interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
}

/**
 * Interface for import result
 */
interface ImportErrorDetail {
  indice: number;
  dt: string;
  error: string;
  data: ViajeImportData;
}

interface ImportResult {
  successCount: number;
  failCount: number;
  viajesCreados: IViaje[];
  erroresDetallados: ImportErrorDetail[];
}

/**
 * Valida los datos básicos de la petición
 */
function validateRequestData(body: Partial<BulkImportRequest> | null | undefined): {
  isValid: boolean;
  error?: string;
} {
  if (!body || Object.keys(body).length === 0) {
    return { isValid: false, error: 'Cuerpo de solicitud vacío' };
  }

  const { cliente, viajes } = body;

  if (!cliente || !Types.ObjectId.isValid(cliente)) {
    return { isValid: false, error: 'ID de Cliente inválido' };
  }

  if (!Array.isArray(viajes) || viajes.length === 0) {
    return { isValid: false, error: 'Formato de datos inválido o sin viajes' };
  }

  return { isValid: true };
}

/**
 * Crea el registro de importación temporal
 */
async function createImportRecord(
  clienteId: string,
  erroresMapeo: ErrorMapeo[] = [],
  sitesNoEncontrados: string[] = [],
  session: mongoose.ClientSession
): Promise<string> {
  const missingSitesCount = sitesNoEncontrados.length;
  const failCountFromFrontend = erroresMapeo.length;

  const importacion = new ImportacionTemporal({
    cliente: clienteId,
    status: 'processing',
    failCountInitial: failCountFromFrontend,
    successCountInitial: 0,
    failureDetails: {
      missingSites: {
        count: missingSitesCount,
        details: sitesNoEncontrados,
      },
      missingPersonal: { count: 0, details: [] },
      missingVehiculos: { count: 0, details: [] },
      missingTramos: { count: 0, details: [] },
      duplicateDt: { count: 0, details: [] },
      invalidData: { count: 0, details: [] },
    },
    failedTrips: erroresMapeo.map((error, _index) => ({
      originalIndex: error.fila,
      dt: String(`Viaje ${error.fila}`),
      reason: 'MISSING_SITE',
      message: error.error,
      data: {},
    })),
  });

  await importacion.save({ session });
  return importacion._id?.toString() || '';
}

/**
 * Valida un viaje individual
 */
function validateViajeData(viajeData: ViajeImportData): { isValid: boolean; error?: string } {
  if (!viajeData.fecha || !viajeData.origen || !viajeData.destino || !viajeData.dt) {
    return { isValid: false, error: 'Faltan campos obligatorios: fecha, origen, destino o dt' };
  }

  if (typeof viajeData.chofer === 'number') {
    return {
      isValid: false,
      error: `Chofer inválido: recibido número ${viajeData.chofer}, se esperaba ObjectId`,
    };
  }

  return { isValid: true };
}

/**
 * Prepara los datos del viaje para creación
 */
async function prepareViajeData(
  viajeData: ViajeImportData,
  clienteId: string
): Promise<ViajeImportData> {
  const preparedData = { ...viajeData };

  // Asignar cliente si no viene en los datos
  preparedData.cliente = preparedData.cliente || clienteId;

  // Si no se especifica tipoTramo, buscar el tipo con tarifa más alta
  if (!preparedData.tipoTramo) {
    logger.debug(
      `Viaje DT ${preparedData.dt}: tipoTramo no especificado, buscando el tipo con tarifa más alta...`
    );

    const tipoTramoOptimo = await tramoService.getTipoTramoConTarifaMasAlta(
      preparedData.origen,
      preparedData.destino,
      preparedData.cliente,
      preparedData.fecha ? new Date(preparedData.fecha) : new Date()
    );

    preparedData.tipoTramo = tipoTramoOptimo;
    logger.info(
      `Viaje DT ${preparedData.dt}: Asignado tipoTramo automáticamente: ${tipoTramoOptimo}`
    );
  }

  // Asegurar que peaje y tarifa están presentes (serán calculados en pre('save'))
  if (typeof preparedData.peaje === 'undefined') {
    preparedData.peaje = 0; // Valor temporal, será calculado en pre('save')
  }
  if (typeof preparedData.tarifa === 'undefined') {
    preparedData.tarifa = 0; // Valor temporal, será calculado en pre('save')
  }

  return preparedData;
}

/**
 * Categoriza el tipo de error basado en el mensaje
 */
function categorizeError(errorMsg: string): string {
  if (errorMsg.includes('tramo') || errorMsg.includes('tarifa')) return 'tramo';
  if (errorMsg.includes('chofer') || errorMsg.includes('personal')) return 'personal';
  if (errorMsg.includes('vehiculo')) return 'vehiculo';
  if (errorMsg.includes('duplicate') || errorMsg.includes('dt')) return 'duplicate';
  return 'invalid';
}

/**
 * Crea los datos de actualización para errores de tramo
 */
async function createTramoErrorUpdate(
  viajeData: ViajeImportData
): Promise<Record<string, unknown>> {
  const [origenSite, destinoSite] = await Promise.all([
    Site.findById(viajeData.origen).select('nombre'),
    Site.findById(viajeData.destino).select('nombre'),
  ]);

  return {
    $inc: { 'failureDetails.missingTramos.count': 1 },
    $push: {
      'failureDetails.missingTramos.details': {
        origen: origenSite?.nombre || `ID: ${viajeData.origen}`,
        destino: destinoSite?.nombre || `ID: ${viajeData.destino}`,
        fecha: viajeData.fecha
          ? new Date(viajeData.fecha).toISOString().split('T')[0]
          : 'Fecha desconocida',
      },
    },
  };
}

/**
 * Crea los datos de actualización para errores generales
 */
function createGeneralErrorUpdate(
  category: string,
  viajeData: ViajeImportData,
  index: number
): Record<string, unknown> {
  const detailValue = String(viajeData.dt || `Viaje ${index + 1}`);

  const categoryMap: Record<string, string> = {
    personal: 'failureDetails.missingPersonal',
    vehiculo: 'failureDetails.missingVehiculos',
    duplicate: 'failureDetails.duplicateDt',
    invalid: 'failureDetails.invalidData',
  };

  const field = categoryMap[category];
  if (!field) return {};

  return {
    $inc: { [`${field}.count`]: 1 },
    $push: { [`${field}.details`]: detailValue },
  };
}

/**
 * Actualiza las categorías de error en ImportacionTemporal
 */
async function updateErrorCategories(
  errorMsg: string,
  viajeData: ViajeImportData,
  index: number,
  importacionId: string,
  session: mongoose.ClientSession
): Promise<void> {
  const category = categorizeError(errorMsg);
  let updateData: Record<string, unknown> = {};

  if (category === 'tramo') {
    updateData = await createTramoErrorUpdate(viajeData);
  } else {
    updateData = createGeneralErrorUpdate(category, viajeData, index);
  }

  if (Object.keys(updateData).length > 0) {
    await ImportacionTemporal.findByIdAndUpdate(importacionId, updateData, { session });
  }
}

/**
 * Procesa un viaje individual
 */
async function processViaje(
  viajeData: ViajeImportData,
  index: number,
  clienteId: string,
  importacionId: string,
  session: mongoose.ClientSession
): Promise<{ success: true; viaje: IViaje } | { success: false; error: ImportErrorDetail }> {
  try {
    // Validar datos básicos
    const validation = validateViajeData(viajeData);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Preparar datos del viaje
    const preparedData = await prepareViajeData(viajeData, clienteId);

    // Validar datos antes de crear el viaje
    logger.debug(`Validando datos del viaje ${index + 1}:`, {
      chofer: preparedData.chofer,
      choferType: typeof preparedData.chofer,
      dt: preparedData.dt,
      origen: preparedData.origen,
      destino: preparedData.destino,
    });

    // Crear el viaje
    const nuevoViaje = await new Viaje(preparedData).save({ session });

    return { success: true, viaje: nuevoViaje };
  } catch (error: unknown) {
    const errorMsg =
      (error instanceof Error ? error.message : String(error)) || 'Error desconocido';
    logger.error(
      `Error procesando viaje ${index + 1} (DT: ${viajeData.dt || 'sin DT'}):`,
      errorMsg
    );

    // Actualizar categorías de error en ImportacionTemporal
    if (importacionId) {
      await updateErrorCategories(errorMsg, viajeData, index, importacionId, session);
    }

    const errorDetail: ImportErrorDetail = {
      indice: index + 1,
      dt: viajeData.dt || 'sin DT',
      error: errorMsg,
      data: viajeData,
    };

    return {
      success: false,
      error: errorDetail,
    };
  }
}

/**
 * Procesa todos los viajes
 */
async function processViajes(
  viajes: ViajeImportData[],
  clienteId: string,
  importacionId: string,
  session: mongoose.ClientSession
): Promise<ImportResult> {
  let successCount = 0;
  let failCount = 0;
  const viajesCreados: IViaje[] = [];
  const erroresDetallados: ImportErrorDetail[] = [];

  for (let i = 0; i < viajes.length; i++) {
    const result = await processViaje(viajes[i], i, clienteId, importacionId, session);

    if (result.success) {
      viajesCreados.push(result.viaje);
      successCount++;
    } else if (result.error) {
      erroresDetallados.push(result.error);
      failCount++;
    }
  }

  return { successCount, failCount, viajesCreados, erroresDetallados };
}

/**
 * Finaliza la importación actualizando el registro
 */
async function finalizeImport(
  importacionId: string,
  result: ImportResult,
  erroresMapeo: ErrorMapeo[],
  session: mongoose.ClientSession
): Promise<void> {
  const totalFailCountFinal = result.failCount + erroresMapeo.length;

  await ImportacionTemporal.findByIdAndUpdate(
    importacionId,
    {
      status: 'completed',
      successCountInitial: result.successCount,
      failCountInitial: totalFailCountFinal,
      message: `Importación completada: ${result.successCount} viajes creados, ${totalFailCountFinal} errores`,
      failedTrips: [
        ...erroresMapeo.map((error) => ({
          originalIndex: error.fila,
          dt: `Viaje ${error.fila}`,
          reason: 'MISSING_SITE',
          message: error.error,
          data: {},
        })),
        ...result.erroresDetallados.map((error) => ({
          originalIndex: error.indice,
          dt: String(error.dt),
          reason: 'PROCESSING_ERROR',
          message: error.error,
          data: error.data,
        })),
      ],
    },
    { session }
  );
}

/**
 * Crea múltiples viajes en una sola operación
 *
 * @description Inicia el proceso de importación masiva de viajes en dos etapas.
 *              Etapa 1: Intenta importar todos los viajes, registra éxitos y fallos detallados.
 */
export const iniciarBulkImportViajes = async (
  req: Request<ParamsDictionary, ApiResponse, BulkImportRequest>,
  res: Response<ApiResponse>
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let importacionId: string | null = null;

  try {
    // Validar datos de la petición
    const validation = validateRequestData(req.body);
    if (!validation.isValid) {
      logger.error('ERROR:', validation.error);
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({ success: false, message: validation.error });
      return;
    }

    const { cliente: clienteId, viajes, erroresMapeo = [], sitesNoEncontrados = [] } = req.body;

    logger.debug('Datos recibidos para bulk import:', {
      clienteId,
      cantidadViajes: viajes.length,
      erroresMapeo: erroresMapeo.length,
      sitesNoEncontrados: sitesNoEncontrados.length,
    });

    // Crear registro de importación temporal
    importacionId = await createImportRecord(clienteId, erroresMapeo, sitesNoEncontrados, session);

    // Verificar que el cliente existe
    const clienteDoc = await Cliente.findById(clienteId).session(session).lean();
    if (!clienteDoc) {
      if (importacionId) {
        await ImportacionTemporal.findByIdAndUpdate(
          importacionId,
          { status: 'failed', message: 'Cliente no encontrado' },
          { session }
        );
      }
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({ success: false, message: 'Cliente no encontrado' });
      return;
    }

    logger.info(
      `Iniciando importación masiva de viajes para cliente: ${clienteDoc.nombre} (${clienteId})`
    );
    logger.info(`Total de viajes a procesar: ${viajes.length}`);

    // Procesar todos los viajes
    const result = await processViajes(viajes, clienteId, importacionId, session);

    // Finalizar importación
    await finalizeImport(importacionId, result, erroresMapeo, session);

    await session.commitTransaction();
    session.endSession();

    const totalFailCountFinal = result.failCount + erroresMapeo.length;
    res.json({
      success: true,
      message: `Importación completada: ${result.successCount} viajes creados, ${totalFailCountFinal} errores`,
      data: {
        importacionId,
        clienteId,
        totalViajes: viajes.length + erroresMapeo.length,
        successCount: result.successCount,
        failCount: totalFailCountFinal,
        viajesCreados: result.viajesCreados.map((viaje) => String(viaje._id)),
        erroresDetallados: [...erroresMapeo, ...result.erroresDetallados],
        sitesNoEncontrados,
      },
    });
  } catch (error: unknown) {
    logger.error('Error en iniciarBulkImportViajes:', error);

    if (importacionId) {
      try {
        await ImportacionTemporal.findByIdAndUpdate(
          importacionId,
          {
            status: 'failed',
            message: `Error durante importación: ${error instanceof Error ? error.message : String(error)}`,
          },
          { session }
        );
      } catch (updateError) {
        logger.error('Error al actualizar estado de importación:', updateError);
      }
    }

    await session.abortTransaction();
    session.endSession();

    const errorMessage = error instanceof Error ? error.message : String(error);
    ApiResponseClass.error(res, 'Error interno durante la importación', 500, {
      detail: errorMessage,
    });
  }
};
