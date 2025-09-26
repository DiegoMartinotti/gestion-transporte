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
 * Crea un tramo de prueba con tipos TRMC y TRMI para testing de importación
 * @param req Request autenticado con datos de origen, destino y cliente
 * @param res Response con resultado de la prueba
 */
// eslint-disable-next-line max-lines-per-function
const testImportacionTipos = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { origen, destino, cliente } = req.body;

    if (!origen || !destino || !cliente) {
      res.status(400).json({
        success: false,
        message: 'Se requieren origen, destino y cliente para la prueba',
      });
      return;
    }

    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setFullYear(fechaFin.getFullYear() + 1);

    const nuevoTramo = new Tramo({
      origen,
      destino,
      cliente,
      tarifasHistoricas: [
        {
          tipo: 'TRMC',
          metodoCalculo: 'Kilometro',
          valor: 100,
          valorPeaje: 0,
          vigenciaDesde: fechaInicio,
          vigenciaHasta: fechaFin,
        },
        {
          tipo: 'TRMI',
          metodoCalculo: 'Kilometro',
          valor: 200,
          valorPeaje: 0,
          vigenciaDesde: fechaInicio,
          vigenciaHasta: fechaFin,
        },
      ],
    });

    await nuevoTramo.save();

    res.json({
      success: true,
      message: 'Prueba completada correctamente',
      data: nuevoTramo,
    });
  } catch (error: unknown) {
    logger.error('Error en prueba de importación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al realizar la prueba de importación',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export default testImportacionTipos;
