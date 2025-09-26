import { Response } from 'express';
import Tramo from '../../models/Tramo';
import logger from '../../utils/logger';

/**
 * Interface for authenticated user in request
 */
interface AuthenticatedUser {
  id: string;
  email: string;
  roles?: string[];
}

/**
 * Interface for authenticated request
 */
interface AuthenticatedRequest {
  user?: AuthenticatedUser;
  body: unknown;
  params: unknown;
  query: unknown;
}

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
 * Normaliza los tipos de tramos en la base de datos (TRMC/TRMI)
 * @param req Request autenticado
 * @param res Response con resultado de la normalización
 */
// eslint-disable-next-line max-lines-per-function
const normalizarTramos = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const resultados = {
      procesados: 0,
      actualizados: 0,
      errores: [] as unknown[],
    };

    resultados.procesados = await Tramo.countDocuments();

    try {
      const resultTRMC = await Tramo.updateMany(
        { 'tarifasHistoricas.tipo': { $regex: /^trmc$/i, $ne: 'TRMC' } },
        { $set: { 'tarifasHistoricas.$[elem].tipo': 'TRMC' } },
        { arrayFilters: [{ 'elem.tipo': { $regex: /^trmc$/i } }], multi: true }
      );

      const resultTRMI = await Tramo.updateMany(
        { 'tarifasHistoricas.tipo': { $regex: /^trmi$/i, $ne: 'TRMI' } },
        { $set: { 'tarifasHistoricas.$[elem].tipo': 'TRMI' } },
        { arrayFilters: [{ 'elem.tipo': { $regex: /^trmi$/i } }], multi: true }
      );

      const resultNonValid = await Tramo.updateMany(
        { 'tarifasHistoricas.tipo': { $nin: ['TRMC', 'TRMI', 'trmc', 'trmi'] } },
        { $set: { 'tarifasHistoricas.$[elem].tipo': 'TRMC' } },
        { arrayFilters: [{ 'elem.tipo': { $nin: ['TRMC', 'TRMI', 'trmc', 'trmi'] } }], multi: true }
      );

      const resultOldModel = await Tramo.updateMany({ tipo: { $exists: true } }, [
        {
          $set: {
            tipo: {
              $cond: [{ $regexMatch: { input: '$tipo', regex: /^trmi$/i } }, 'TRMI', 'TRMC'],
            },
          },
        },
      ]);

      resultados.actualizados =
        (resultTRMC.modifiedCount || 0) +
        (resultTRMI.modifiedCount || 0) +
        (resultNonValid.modifiedCount || 0) +
        (resultOldModel.modifiedCount || 0);

      logger.info(
        `Normalización masiva completada: ${resultados.actualizados} tramos actualizados`
      );
    } catch (error: unknown) {
      logger.error('Error en actualización masiva:', error);
      resultados.errores.push({
        fase: 'actualizacionMasiva',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    res.json({
      success: true,
      data: resultados,
    });
  } catch (error: unknown) {
    logger.error('Error normalizando tramos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al normalizar los tramos',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export default normalizarTramos;
