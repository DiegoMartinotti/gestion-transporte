import { Request, Response } from 'express';
import TarifaMetodo from '../../models/TarifaMetodo';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { param, validationResult } from 'express-validator';
import { Types } from 'mongoose';

/**
 * Validators para obtener método por ID
 */
export const getTarifaMetodoByIdValidators = [
  param('id').custom((value) => {
    if (!Types.ObjectId.isValid(value)) {
      throw new Error('ID del método no válido');
    }
    return true;
  }),
];

/**
 * Obtiene un método de cálculo de tarifa por su ID
 */
export const getTarifaMetodoById = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar parámetros
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Parámetros inválidos', 400, errors.array());
      return;
    }

    const { id } = req.params;

    // Buscar el método
    const metodo = await TarifaMetodo.findById(id);

    if (!metodo) {
      ApiResponse.error(res, 'Método de tarifa no encontrado', 404);
      return;
    }

    // Información adicional del método
    const informacionAdicional = {
      variablesDisponibles: metodo.obtenerVariablesDisponibles(),
      formulaValida: metodo.validarFormula(metodo.formulaBase),
      estadisticasUso: {
        // Estos valores se podrían obtener de la base de datos o cache
        // si se implementa un sistema de estadísticas
        vecesUtilizado: 0,
        ultimoUso: null,
      },
    };

    const respuesta = {
      ...metodo.toObject(),
      informacionAdicional,
    };

    logger.debug(`[TarifaMetodo] Método consultado: ${metodo.codigo}`, {
      metodoId: metodo._id,
      usuario: (req as any).user?.email,
    });

    ApiResponse.success(res, respuesta, 'Método de tarifa obtenido exitosamente');
  } catch (error: any) {
    logger.error('[TarifaMetodo] Error al obtener método:', error);
    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};
