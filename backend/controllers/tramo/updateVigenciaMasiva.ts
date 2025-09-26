/* eslint-disable max-depth */
import { Request, Response } from 'express';
import Tramo from '../../models/Tramo';
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

/**
 * Actualiza masivamente las fechas de vigencia de múltiples tramos
 * @param req Request con IDs de tramos y nuevas fechas de vigencia
 * @param res Response con resultado de la actualización masiva
 */
// eslint-disable-next-line complexity, max-lines-per-function, sonarjs/cognitive-complexity
const updateVigenciaMasiva = async (
  req: Request<object, ApiResponse<VigenciaUpdateResult>, VigenciaUpdateRequest>,
  res: Response<ApiResponse<VigenciaUpdateResult>>
): Promise<void> => {
  try {
    const tramosIds = req.body.tramoIds;
    const vigenciaDesde = req.body.vigenciaDesde;
    const vigenciaHasta = req.body.vigenciaHasta;
    const tipoTramo = req.body.tipoTramo;

    if (!tramosIds || !Array.isArray(tramosIds) || tramosIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs de tramos',
      });
      return;
    }

    if (!vigenciaDesde || !vigenciaHasta) {
      res.status(400).json({
        success: false,
        message: 'Se requieren las fechas de vigencia',
      });
      return;
    }

    const fechaDesde = new Date(vigenciaDesde);
    fechaDesde.setUTCHours(12, 0, 0, 0);

    const fechaHasta = new Date(vigenciaHasta);
    fechaHasta.setUTCHours(12, 0, 0, 0);

    if (fechaHasta < fechaDesde) {
      res.status(400).json({
        success: false,
        message: 'La fecha de fin debe ser posterior a la fecha de inicio',
      });
      return;
    }

    const actualizados: string[] = [];
    const conflictos: Array<{ id: string; tarifaId?: string; error: string }> = [];
    const noEncontrados: string[] = [];

    for (const tramoId of tramosIds) {
      try {
        const tramo = await Tramo.findById(tramoId);

        if (!tramo) {
          noEncontrados.push(tramoId);
          logger.warn(`Tramo con ID ${tramoId} no encontrado para actualización masiva.`);
          continue;
        }

        let tarifasModificadas = false;

        for (let i = 0; i < tramo.tarifasHistoricas.length; i++) {
          const tarifa = tramo.tarifasHistoricas[i];

          if (tipoTramo && tarifa.tipo !== tipoTramo) {
            continue;
          }

          const hayConflicto = tramo.tarifasHistoricas.some(
            (otraTarifa, j) =>
              i !== j &&
              otraTarifa.tipo === tarifa.tipo &&
              otraTarifa.metodoCalculo === tarifa.metodoCalculo &&
              otraTarifa.vigenciaDesde <= fechaHasta &&
              otraTarifa.vigenciaHasta >= fechaDesde
          );

          if (hayConflicto) {
            const errorMsg = `Conflicto potencial de fechas al actualizar tarifa (${tarifa.tipo}/${tarifa.metodoCalculo}) en tramo ${tramoId}.`;
            logger.error(errorMsg);
            conflictos.push({ id: tramoId, tarifaId: tarifa._id?.toString(), error: errorMsg });
          } else {
            tramo.tarifasHistoricas[i].vigenciaDesde = fechaDesde;
            tramo.tarifasHistoricas[i].vigenciaHasta = fechaHasta;
            tarifasModificadas = true;
          }
        }

        if (tarifasModificadas) {
          try {
            await tramo.save();
            actualizados.push(tramoId);
            logger.debug(`Tramo ${tramoId} actualizado correctamente.`);
          } catch (saveError: unknown) {
            logger.error(
              `Error al guardar tramo ${tramoId} tras actualización masiva: ${saveError.message}`
            );
            conflictos.push({ id: tramoId, error: `Error al guardar: ${saveError.message}` });
          }
        } else if (conflictos.some((c) => c.id === tramoId)) {
          logger.warn(`Tramo ${tramoId} no actualizado debido a conflictos de fechas detectados.`);
        } else {
          const tipoTexto = tipoTramo ? `del tipo ${tipoTramo} ` : '';
          logger.info(`Tramo ${tramoId}: No se encontraron tarifas ${tipoTexto}para actualizar.`);
        }
      } catch (error: unknown) {
        logger.error(`Error procesando tramo ${tramoId} en actualización masiva:`, error);
        conflictos.push({
          id: tramoId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const resultado: VigenciaUpdateResult = {
      actualizados,
      conflictos,
      noEncontrados,
      mensaje: `Proceso completado: ${actualizados.length} tramos actualizados, ${conflictos.length} conflictos, ${noEncontrados.length} no encontrados.`,
    };

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
