// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import ImportacionTemporal from '../../models/ImportacionTemporal';
import logger from '../../utils/logger';
import { ExcelTemplateService } from '../../services/excelTemplateService';

type FailureSummaryKey = 'missingSites' | 'missingPersonal' | 'missingVehiculos' | 'missingTramos';

type FailureSummary = Partial<Record<FailureSummaryKey, { count: number }>>;

const failureSummaryKeys: FailureSummaryKey[] = [
  'missingSites',
  'missingPersonal',
  'missingVehiculos',
  'missingTramos',
];

const isValidImportId = (importId?: string): importId is string =>
  Boolean(importId && Types.ObjectId.isValid(importId));

const hasMissingData = (failureDetails?: FailureSummary | null): boolean =>
  failureSummaryKeys.some((key) => (failureDetails?.[key]?.count ?? 0) > 0);

const respondWithError = (
  res: Response,
  status: number,
  message: string,
  logMessage: string
): void => {
  logger.error(logMessage);
  res.status(status).json({
    success: false,
    message,
  });
};

/**
 * Descargar plantillas pre-rellenadas para corrección de datos faltantes
 */
export const descargarPlantillaCorreccion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { importId } = req.params;
    logger.info(`Solicitud de descarga de plantillas para importId: ${importId}`);

    if (!isValidImportId(importId)) {
      respondWithError(
        res,
        400,
        'ID de importación inválido',
        `ID de importación inválido: ${importId}`
      );
      return;
    }

    const importacion = await ImportacionTemporal.findById(importId).lean();
    logger.info(`Importación encontrada: ${!!importacion}`);

    if (!importacion) {
      respondWithError(
        res,
        404,
        'Importación no encontrada o expirada',
        `Importación no encontrada para ID: ${importId}`
      );
      return;
    }

    logger.info(`Datos de la importación:`, {
      cliente: importacion.cliente,
      status: importacion.status,
      failureDetails: importacion.failureDetails,
    });

    const failureDetails = importacion.failureDetails as FailureSummary | undefined;
    logger.info(`Tiene datos faltantes: ${hasMissingData(failureDetails)}`);
    logger.info(`Sites faltantes: ${failureDetails?.missingSites?.count ?? 0}`);

    if (!hasMissingData(failureDetails)) {
      respondWithError(
        res,
        400,
        'No hay datos faltantes para esta importación',
        'No hay datos faltantes para esta importación'
      );
      return;
    }

    await ExcelTemplateService.generateMissingDataTemplates(res, importacion);
    logger.info(`Plantillas de corrección generadas para importación ${importId}`);
  } catch (error: unknown) {
    logger.error('Error al generar plantillas de corrección:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar plantillas de corrección',
    });
  }
};
