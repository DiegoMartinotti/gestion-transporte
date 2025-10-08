import { Response } from 'express';
import ReglaTarifa from '../../models/ReglaTarifa';
import Cliente from '../../models/Cliente';
import TarifaMetodo from '../../models/TarifaMetodo';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { param, body, validationResult } from 'express-validator';
import mongoose, { Types } from 'mongoose';
import {
  ensureCodigoDisponible,
  validateHorariosAplicacion,
  validateDiasSemana,
  buildReglaTarifaUpdate,
  validateRangoVigencia,
  logHistoricalDeactivation,
  type UpdateReglaTarifaRequest,
  type UpdateReglaTarifaRequestWithUser,
  type UpdateReglaTarifaBody,
  type ValidationRequest,
} from './updateReglaTarifa.helpers';

/**
 * Validators para actualizar regla de tarifa
 */
export const updateReglaTarifaValidators = [
  param('id').custom((value) => {
    const idValue = String(value);
    if (!Types.ObjectId.isValid(idValue)) {
      throw new Error('ID de la regla no válido');
    }
    return true;
  }),
  body('codigo')
    .optional()
    .matches(/^[A-Z][A-Z0-9_]*$/)
    .withMessage(
      'El código debe empezar con letra mayúscula y contener solo letras mayúsculas, números y guiones bajos'
    ),
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('El nombre no puede estar vacío'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('La descripción no puede estar vacía'),
  body('cliente')
    .optional()
    .custom(async (value) => {
      if (value && !Types.ObjectId.isValid(String(value))) {
        throw new Error('ID de cliente no válido');
      }
      if (value) {
        const cliente = await Cliente.findById(String(value));
        if (!cliente) {
          throw new Error('Cliente no encontrado');
        }
      }
      return true;
    }),
  body('metodoCalculo')
    .optional()
    .custom(async (value) => {
      if (value) {
        const metodo = await TarifaMetodo.findByCodigoActivo(String(value));
        if (!metodo) {
          throw new Error('Método de cálculo no encontrado o inactivo');
        }
      }
      return true;
    }),
  body('condiciones').optional().isArray().withMessage('Las condiciones deben ser un array'),
  body('condiciones.*.campo')
    .optional()
    .notEmpty()
    .withMessage('El campo de la condición es requerido'),
  body('condiciones.*.operador')
    .optional()
    .isIn([
      'igual',
      'diferente',
      'mayor',
      'menor',
      'mayorIgual',
      'menorIgual',
      'entre',
      'en',
      'contiene',
    ])
    .withMessage('Operador de condición no válido'),
  body('modificadores').optional().isArray().withMessage('Los modificadores deben ser un array'),
  body('modificadores.*.tipo')
    .optional()
    .isIn(['porcentaje', 'fijo', 'formula'])
    .withMessage('Tipo de modificador debe ser porcentaje, fijo o formula'),
  body('modificadores.*.aplicarA')
    .optional()
    .isIn(['tarifa', 'peaje', 'total', 'extras'])
    .withMessage('AplicarA debe ser tarifa, peaje, total o extras'),
  body('fechaInicioVigencia')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio de vigencia debe ser válida'),
  body('fechaFinVigencia')
    .optional()
    .isISO8601()
    .withMessage('La fecha de fin de vigencia debe ser válida')
    .custom((fechaFin, { req }) => {
      const body = req.body as UpdateReglaTarifaBody;
      if (fechaFin && body.fechaInicioVigencia) {
        const inicio = new Date(body.fechaInicioVigencia);
        const fin = new Date(String(fechaFin));
        if (fin <= inicio) {
          throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }
      }
      return true;
    }),
];

/**
 * Actualiza una regla de tarifa
 */
// eslint-disable-next-line complexity, max-lines-per-function, sonarjs/cognitive-complexity
export const updateReglaTarifa = async (
  req: UpdateReglaTarifaRequest,
  res: Response
): Promise<void> => {
  try {
    // Validar entrada
    // El validador no expone tipos compatibles con Express Request tipado, se castea.
    const errors = validationResult(req as unknown as ValidationRequest);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Datos de entrada inválidos', 400, { errors: errors.array() });
      return;
    }

    const { id } = req.params;

    // Buscar la regla actual
    const reglaActual = await ReglaTarifa.findById(id);
    if (!reglaActual) {
      ApiResponse.error(res, 'Regla de tarifa no encontrada', 404);
      return;
    }

    const { codigo, diasSemana, horariosAplicacion, activa } = req.body;

    const codigoError = await ensureCodigoDisponible(id, codigo, reglaActual.codigo);
    if (codigoError) {
      ApiResponse.error(res, codigoError, 409);
      return;
    }

    const horariosError = validateHorariosAplicacion(horariosAplicacion);
    if (horariosError) {
      ApiResponse.error(res, horariosError, 400);
      return;
    }

    const diasError = validateDiasSemana(diasSemana);
    if (diasError) {
      ApiResponse.error(res, diasError, 400);
      return;
    }

    const actualizacion = buildReglaTarifaUpdate(req.body);

    const vigenciaError = validateRangoVigencia(actualizacion, reglaActual);
    if (vigenciaError) {
      ApiResponse.error(res, vigenciaError, 400);
      return;
    }

    // Actualizar la regla
    const reglaActualizada = await ReglaTarifa.findByIdAndUpdate(
      id,
      { $set: actualizacion },
      { new: true, runValidators: true }
    ).populate('cliente', 'nombre razonSocial');

    if (!reglaActualizada) {
      ApiResponse.error(res, 'Error al actualizar la regla de tarifa', 500);
      return;
    }

    // Log de la actualización
    logger.info(`[ReglaTarifa] Regla actualizada: ${reglaActualizada.codigo}`, {
      reglaId: reglaActualizada._id,
      cambios: Object.keys(actualizacion),
      cliente: reglaActualizada.cliente ? 'Específica' : 'General',
      usuario: (req as UpdateReglaTarifaRequestWithUser).user?.email,
    });

    logHistoricalDeactivation(activa, reglaActual, reglaActualizada);

    ApiResponse.success(res, reglaActualizada, 'Regla de tarifa actualizada exitosamente');
  } catch (error: unknown) {
    logger.error('[ReglaTarifa] Error al actualizar regla:', error);

    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));
      ApiResponse.error(res, 'Error de validación', 400, { errors: validationErrors });
      return;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      ApiResponse.error(res, 'El código de la regla ya existe', 409);
      return;
    }

    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};
