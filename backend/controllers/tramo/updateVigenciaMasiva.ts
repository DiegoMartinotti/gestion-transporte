/* eslint-disable max-depth */
import { Request, Response } from 'express';
import Tramo, { ITramo } from '../../models/Tramo';
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
 * Interface for vigencia update request
 */
interface VigenciaUpdateRequest {
  tramoIds: string[];
  vigenciaDesde: string;
  vigenciaHasta: string;
  tipoTramo?: string;
}

/**
 * Interface for vigencia update result
 */
interface VigenciaUpdateResult {
  actualizados: string[];
  conflictos: Array<{
    id: string;
    tarifaId?: string;
    error: string;
  }>;
  noEncontrados: string[];
  mensaje: string;
}

interface TramoTarifaUpdateResult {
  tarifasModificadas: boolean;
  conflictos: Array<{ tarifaId?: string; error: string }>;
  revisoTarifas: boolean;
}

interface TramoProcesoResultado {
  encontrado: boolean;
  actualizado: boolean;
  conflictos: Array<{ tarifaId?: string; error: string }>;
  revisoTarifas: boolean;
}

const validateRequestPayload = (body: VigenciaUpdateRequest): string | null => {
  if (!Array.isArray(body.tramoIds) || body.tramoIds.length === 0) {
    return 'Se requiere un array de IDs de tramos';
  }
  if (!body.vigenciaDesde || !body.vigenciaHasta) {
    return 'Se requieren las fechas de vigencia';
  }
  return null;
};

const parseVigencias = (
  vigenciaDesde: string,
  vigenciaHasta: string
): { fechaDesde: Date; fechaHasta: Date } | { error: string } => {
  const fechaDesde = new Date(vigenciaDesde);
  fechaDesde.setUTCHours(12, 0, 0, 0);

  const fechaHasta = new Date(vigenciaHasta);
  fechaHasta.setUTCHours(12, 0, 0, 0);

  if (Number.isNaN(fechaDesde.getTime()) || Number.isNaN(fechaHasta.getTime())) {
    return { error: 'Las fechas proporcionadas no son válidas' };
  }

  if (fechaHasta < fechaDesde) {
    return { error: 'La fecha de fin debe ser posterior a la fecha de inicio' };
  }

  return { fechaDesde, fechaHasta };
};

const actualizarTarifasDeTramo = ({
  tramoId,
  tramo,
  fechaDesde,
  fechaHasta,
  tipoTramo,
}: {
  tramoId: string;
  tramo: ITramo;
  fechaDesde: Date;
  fechaHasta: Date;
  tipoTramo?: string;
}): TramoTarifaUpdateResult => {
  const conflictos: Array<{ tarifaId?: string; error: string }> = [];
  let tarifasModificadas = false;
  let revisoTarifas = false;

  for (let i = 0; i < tramo.tarifasHistoricas.length; i++) {
    const tarifa = tramo.tarifasHistoricas[i];

    if (tipoTramo && tarifa.tipo !== tipoTramo) {
      continue;
    }

    revisoTarifas = true;

    const hayConflicto = tramo.tarifasHistoricas.some((otraTarifa, j) => {
      if (i === j) {
        return false;
      }

      const coincideTipo =
        otraTarifa.tipo === tarifa.tipo && otraTarifa.metodoCalculo === tarifa.metodoCalculo;
      if (!coincideTipo) {
        return false;
      }

      return otraTarifa.vigenciaDesde <= fechaHasta && otraTarifa.vigenciaHasta >= fechaDesde;
    });

    if (hayConflicto) {
      const errorMsg = `Conflicto potencial de fechas al actualizar tarifa (${tarifa.tipo}/${tarifa.metodoCalculo}) en tramo ${tramoId}.`;
      logger.error(errorMsg);
      conflictos.push({ tarifaId: tarifa._id?.toString(), error: errorMsg });
      continue;
    }

    tramo.tarifasHistoricas[i].vigenciaDesde = fechaDesde;
    tramo.tarifasHistoricas[i].vigenciaHasta = fechaHasta;
    tarifasModificadas = true;
  }

  return { tarifasModificadas, conflictos, revisoTarifas };
};

const procesarTramo = async (
  tramoId: string,
  fechaDesde: Date,
  fechaHasta: Date,
  tipoTramo?: string
): Promise<TramoProcesoResultado> => {
  const tramo = await Tramo.findById(tramoId);

  if (!tramo) {
    logger.warn(`Tramo con ID ${tramoId} no encontrado para actualización masiva.`);
    return { encontrado: false, actualizado: false, conflictos: [], revisoTarifas: false };
  }

  const resultado = actualizarTarifasDeTramo({ tramoId, tramo, fechaDesde, fechaHasta, tipoTramo });

  if (!resultado.tarifasModificadas) {
    return {
      encontrado: true,
      actualizado: false,
      conflictos: resultado.conflictos,
      revisoTarifas: resultado.revisoTarifas,
    };
  }

  try {
    await tramo.save();
    logger.debug(`Tramo ${tramoId} actualizado correctamente.`);
    return { encontrado: true, actualizado: true, conflictos: [], revisoTarifas: true };
  } catch (saveError: unknown) {
    const saveErrorMessage = saveError instanceof Error ? saveError.message : String(saveError);
    logger.error(
      `Error al guardar tramo ${tramoId} tras actualización masiva: ${saveErrorMessage}`
    );
    return {
      encontrado: true,
      actualizado: false,
      conflictos: [{ error: `Error al guardar: ${saveErrorMessage}` }],
      revisoTarifas: true,
    };
  }
};

interface ResumenActualizacion {
  actualizados: string[];
  conflictos: Array<{ id: string; tarifaId?: string; error: string }>;
  noEncontrados: string[];
}

const acumularResultadoTramo = (
  resumen: ResumenActualizacion,
  tramoId: string,
  resultado: TramoProcesoResultado,
  tipoTramo?: string
): void => {
  if (!resultado.encontrado) {
    resumen.noEncontrados.push(tramoId);
    return;
  }

  if (resultado.conflictos.length) {
    resumen.conflictos.push(
      ...resultado.conflictos.map((conflicto) => ({
        id: tramoId,
        tarifaId: conflicto.tarifaId,
        error: conflicto.error,
      }))
    );
    logger.warn(`Tramo ${tramoId} no actualizado debido a conflictos de fechas detectados.`);
  }

  if (resultado.actualizado) {
    resumen.actualizados.push(tramoId);
    return;
  }

  if (!resultado.conflictos.length && !resultado.revisoTarifas) {
    const tipoTexto = tipoTramo ? `del tipo ${tipoTramo} ` : '';
    logger.info(`Tramo ${tramoId}: No se encontraron tarifas ${tipoTexto}para actualizar.`);
  }
};

const procesarActualizacionMasiva = async (
  tramoIds: string[],
  fechaDesde: Date,
  fechaHasta: Date,
  tipoTramo?: string
): Promise<VigenciaUpdateResult> => {
  const resumen: ResumenActualizacion = {
    actualizados: [],
    conflictos: [],
    noEncontrados: [],
  };

  for (const tramoId of tramoIds) {
    try {
      const resultado = await procesarTramo(tramoId, fechaDesde, fechaHasta, tipoTramo);
      acumularResultadoTramo(resumen, tramoId, resultado, tipoTramo);
    } catch (error: unknown) {
      logger.error(`Error procesando tramo ${tramoId} en actualización masiva:`, error);
      resumen.conflictos.push({
        id: tramoId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    ...resumen,
    mensaje: `Proceso completado: ${resumen.actualizados.length} tramos actualizados, ${resumen.conflictos.length} conflictos, ${resumen.noEncontrados.length} no encontrados.`,
  };
};

const updateVigenciaMasiva = async (
  req: Request<object, ApiResponse<VigenciaUpdateResult>, VigenciaUpdateRequest>,
  res: Response<ApiResponse<VigenciaUpdateResult>>
): Promise<void> => {
  try {
    const validationError = validateRequestPayload(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        message: validationError,
      });
      return;
    }

    const { tramoIds, vigenciaDesde, vigenciaHasta, tipoTramo } = req.body;
    const vigencias = parseVigencias(vigenciaDesde, vigenciaHasta);

    if ('error' in vigencias) {
      res.status(400).json({
        success: false,
        message: vigencias.error,
      });
      return;
    }

    const resultado = await procesarActualizacionMasiva(
      tramoIds,
      vigencias.fechaDesde,
      vigencias.fechaHasta,
      tipoTramo
    );

    res.json({
      success: true,
      data: resultado,
    });
  } catch (error: unknown) {
    logger.error('Error general en actualización masiva de vigencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al actualizar la vigencia de los tramos',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export default updateVigenciaMasiva;
