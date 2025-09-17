import { Request, Response } from 'express';
import TarifaMetodo from '../../models/TarifaMetodo';
import FormulasPersonalizadasCliente from '../../models/FormulasPersonalizadasCliente';
import ReglaTarifa from '../../models/ReglaTarifa';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { param, validationResult } from 'express-validator';
import { Types } from 'mongoose';

/**
 * Validators para eliminar método de tarifa
 */
export const deleteTarifaMetodoValidators = [
  param('id').custom((value) => {
    if (!Types.ObjectId.isValid(value)) {
      throw new Error('ID del método no válido');
    }
    return true;
  }),
];

/**
 * Interface para verificación de dependencias
 */
interface IDependencias {
  formulasPersonalizadas: number;
  reglasTarifa: number;
  total: number;
}

/**
 * Elimina un método de cálculo de tarifa
 * Verifica dependencias antes de eliminar
 */
export const deleteTarifaMetodo = async (req: Request, res: Response): Promise<void> => {
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

    // Verificar dependencias
    const dependencias: IDependencias = await verificarDependencias(metodo.codigo);

    if (dependencias.total > 0) {
      const mensaje = `No se puede eliminar el método "${metodo.nombre}" porque está siendo utilizado por:`;
      const detalles: string[] = [];

      if (dependencias.formulasPersonalizadas > 0) {
        detalles.push(
          `${dependencias.formulasPersonalizadas} fórmula(s) personalizada(s) de cliente`
        );
      }

      if (dependencias.reglasTarifa > 0) {
        detalles.push(`${dependencias.reglasTarifa} regla(s) de tarifa`);
      }

      const respuestaError = {
        mensaje,
        dependencias: {
          formulasPersonalizadas: dependencias.formulasPersonalizadas,
          reglasTarifa: dependencias.reglasTarifa,
          total: dependencias.total,
        },
        sugerencia:
          'Desactive o elimine primero las dependencias, o considere desactivar el método en lugar de eliminarlo.',
      };

      ApiResponse.error(res, mensaje, 409, respuestaError);
      return;
    }

    // Eliminar el método
    await TarifaMetodo.findByIdAndDelete(id);

    logger.info(`[TarifaMetodo] Método eliminado: ${metodo.codigo}`, {
      metodoId: metodo._id,
      nombre: metodo.nombre,
      usuario: (req as unknown).user?.email,
    });

    ApiResponse.success(
      res,
      {
        id: metodo._id,
        codigo: metodo.codigo,
        nombre: metodo.nombre,
        fechaEliminacion: new Date(),
      },
      'Método de tarifa eliminado exitosamente'
    );
  } catch (error: unknown) {
    logger.error('[TarifaMetodo] Error al eliminar método:', error);
    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};

/**
 * Verifica las dependencias de un método de tarifa
 * @param codigoMetodo - Código del método a verificar
 * @returns Objeto con el conteo de dependencias
 */
async function verificarDependencias(codigoMetodo: string): Promise<IDependencias> {
  try {
    // Verificar fórmulas personalizadas que usan este método
    const formulasPersonalizadas = await FormulasPersonalizadasCliente.countDocuments({
      metodoCalculo: codigoMetodo,
      activa: true,
    });

    // Verificar reglas de tarifa que especifican este método
    const reglasTarifa = await ReglaTarifa.countDocuments({
      metodoCalculo: codigoMetodo,
      activa: true,
    });

    const total = formulasPersonalizadas + reglasTarifa;

    return {
      formulasPersonalizadas,
      reglasTarifa,
      total,
    };
  } catch (error) {
    logger.error('[TarifaMetodo] Error al verificar dependencias:', error);
    // En caso de error, asumir que hay dependencias para evitar eliminaciones accidentales
    return {
      formulasPersonalizadas: 1,
      reglasTarifa: 0,
      total: 1,
    };
  }
}
