import { Request, Response } from 'express';
import TarifaMetodo, { type ITarifaMetodo } from '../../models/TarifaMetodo';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { param, body, validationResult } from 'express-validator';
import mongoose, { Types } from 'mongoose';
import type { ParsedQs } from 'qs';
import type { ParamsDictionary } from 'express-serve-static-core';

interface UpdateTarifaMetodoParams {
  id: string;
}

interface UpdateTarifaMetodoBody {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  formulaBase?: string;
  variables?: unknown;
  prioridad?: number;
  activo?: boolean;
  requiereDistancia?: boolean;
  requierePalets?: boolean;
  permiteFormulasPersonalizadas?: boolean;
  configuracion?: Record<string, unknown>;
}

type UpdateTarifaMetodoRequest = Request<
  UpdateTarifaMetodoParams,
  unknown,
  UpdateTarifaMetodoBody,
  ParsedQs,
  Record<string, unknown>
>;
type UpdateTarifaMetodoRequestWithUser = UpdateTarifaMetodoRequest & {
  user?: { email?: string };
};
type ValidationRequest = Request<
  ParamsDictionary,
  Record<string, unknown>,
  unknown,
  ParsedQs,
  Record<string, unknown>
>;

interface TarifaMetodoUpdatePayload {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  formulaBase?: string;
  variables?: unknown;
  prioridad?: number;
  activo?: boolean;
  requiereDistancia?: boolean;
  requierePalets?: boolean;
  permiteFormulasPersonalizadas?: boolean;
  configuracion?: Record<string, unknown>;
}

const ensureCodigoDisponible = async (
  id: string,
  codigo: UpdateTarifaMetodoBody['codigo'],
  codigoActual: string
): Promise<string | null> => {
  if (!codigo || codigo.toUpperCase() === codigoActual) {
    return null;
  }

  const metodoExistente = await TarifaMetodo.findOne({
    codigo: codigo.toUpperCase(),
    _id: { $ne: id },
  });

  if (metodoExistente) {
    return `Ya existe otro método con el código ${codigo}`;
  }

  return null;
};

const buildTarifaMetodoUpdate = (body: UpdateTarifaMetodoBody): TarifaMetodoUpdatePayload => {
  const actualizacion: TarifaMetodoUpdatePayload = {};
  const assignField = <K extends keyof TarifaMetodoUpdatePayload>(
    field: K,
    value: TarifaMetodoUpdatePayload[K] | undefined
  ): void => {
    if (value !== undefined) {
      actualizacion[field] = value;
    }
  };

  assignField('codigo', body.codigo !== undefined ? body.codigo.toUpperCase() : undefined);
  assignField('nombre', body.nombre);
  assignField('descripcion', body.descripcion);
  assignField('formulaBase', body.formulaBase);
  assignField('variables', body.variables);
  assignField('prioridad', body.prioridad);
  assignField('activo', body.activo);
  assignField('requiereDistancia', body.requiereDistancia);
  assignField('requierePalets', body.requierePalets);
  assignField('permiteFormulasPersonalizadas', body.permiteFormulasPersonalizadas);
  assignField('configuracion', body.configuracion);

  return actualizacion;
};

const validateFormulaActualizada = (
  metodoActual: ITarifaMetodo,
  actualizacion: TarifaMetodoUpdatePayload
): string | null => {
  if (!actualizacion.formulaBase) {
    return null;
  }

  const metodoTemporal = new TarifaMetodo({
    ...metodoActual.toObject(),
    ...actualizacion,
  });

  const formulaEsValida = metodoTemporal.validarFormula(actualizacion.formulaBase);
  if (!formulaEsValida) {
    return 'La fórmula actualizada no es válida';
  }

  return null;
};

const construirRespuesta = (metodoActualizado: ITarifaMetodo) => {
  const metodoComoObjeto = metodoActualizado.toObject();
  return {
    ...metodoComoObjeto,
    informacionAdicional: {
      variablesDisponibles: metodoActualizado.obtenerVariablesDisponibles(),
      formulaValida: metodoActualizado.validarFormula(metodoActualizado.formulaBase),
    },
  };
};

/**
 * Validators para actualizar método de tarifa
 */
export const updateTarifaMetodoValidators = [
  param('id').custom((value) => {
    const idValue = String(value);
    if (!Types.ObjectId.isValid(idValue)) {
      throw new Error('ID del método no válido');
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
  body('formulaBase')
    .optional()
    .isLength({ min: 1 })
    .withMessage('La fórmula base no puede estar vacía'),
  body('variables').optional().isArray().withMessage('Las variables deben ser un array'),
  body('variables.*.nombre')
    .optional()
    .matches(/^[a-zA-Z]\w*$/)
    .withMessage(
      'Nombre de variable debe empezar con letra y contener solo letras, números y guiones bajos'
    ),
  body('variables.*.tipo')
    .optional()
    .isIn(['number', 'string', 'boolean', 'date'])
    .withMessage('Tipo de variable debe ser number, string, boolean o date'),
  body('variables.*.origen')
    .optional()
    .isIn(['tramo', 'viaje', 'cliente', 'vehiculo', 'calculado', 'constante'])
    .withMessage('Origen debe ser tramo, viaje, cliente, vehiculo, calculado o constante'),
  body('prioridad')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La prioridad debe ser un número mayor a 0'),
  body('activo').optional().isBoolean().withMessage('Activo debe ser verdadero o falso'),
  body('requiereDistancia')
    .optional()
    .isBoolean()
    .withMessage('RequiereDistancia debe ser verdadero o falso'),
  body('requierePalets')
    .optional()
    .isBoolean()
    .withMessage('RequierePalets debe ser verdadero o falso'),
  body('permiteFormulasPersonalizadas')
    .optional()
    .isBoolean()
    .withMessage('PermiteFormulasPersonalizadas debe ser verdadero o falso'),
];

/**
 * Actualiza un método de cálculo de tarifa
 */
// eslint-disable-next-line complexity, max-lines-per-function, sonarjs/cognitive-complexity
export const updateTarifaMetodo = async (
  req: UpdateTarifaMetodoRequest,
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

    // Buscar el método actual
    const metodoActual = await TarifaMetodo.findById(id);
    if (!metodoActual) {
      ApiResponse.error(res, 'Método de tarifa no encontrado', 404);
      return;
    }

    const codigoError = await ensureCodigoDisponible(id, req.body.codigo, metodoActual.codigo);
    if (codigoError) {
      ApiResponse.error(res, codigoError, 409);
      return;
    }

    const actualizacion = buildTarifaMetodoUpdate(req.body);

    const formulaError = validateFormulaActualizada(metodoActual, actualizacion);
    if (formulaError) {
      ApiResponse.error(res, formulaError, 400);
      return;
    }

    // Actualizar el método
    const metodoActualizado = await TarifaMetodo.findByIdAndUpdate(
      id,
      { $set: actualizacion },
      { new: true, runValidators: true }
    );

    if (!metodoActualizado) {
      ApiResponse.error(res, 'Error al actualizar el método de tarifa', 500);
      return;
    }

    logger.info(`[TarifaMetodo] Método actualizado: ${metodoActualizado.codigo}`, {
      metodoId: metodoActualizado._id,
      cambios: Object.keys(actualizacion),
      usuario: (req as UpdateTarifaMetodoRequestWithUser).user?.email,
    });

    // Información adicional para la respuesta
    const respuesta = construirRespuesta(metodoActualizado);

    ApiResponse.success(res, respuesta, 'Método de tarifa actualizado exitosamente');
  } catch (error: unknown) {
    logger.error('[TarifaMetodo] Error al actualizar método:', error);

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
      ApiResponse.error(res, 'El código del método ya existe', 409);
      return;
    }

    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};
