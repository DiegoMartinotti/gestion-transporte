import { Request, Response } from 'express';
import TarifaMetodo from '../../models/TarifaMetodo';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { body, validationResult } from 'express-validator';

/**
 * Validators para crear método de tarifa
 */
export const createTarifaMetodoValidators = [
  body('codigo')
    .notEmpty()
    .withMessage('El código es requerido')
    .matches(/^[A-Z][A-Z0-9_]*$/)
    .withMessage(
      'El código debe empezar con letra mayúscula y contener solo letras mayúsculas, números y guiones bajos'
    ),
  body('nombre').notEmpty().withMessage('El nombre es requerido').trim(),
  body('descripcion').notEmpty().withMessage('La descripción es requerida').trim(),
  body('formulaBase').notEmpty().withMessage('La fórmula base es requerida'),
  body('variables').isArray().withMessage('Las variables deben ser un array'),
  body('variables.*.nombre')
    .matches(/^[A-Za-z][A-Za-z0-9_]*$/)
    .withMessage(
      'Nombre de variable debe empezar con letra y contener solo letras, números y guiones bajos'
    ),
  body('variables.*.tipo')
    .isIn(['number', 'string', 'boolean', 'date'])
    .withMessage('Tipo de variable debe ser number, string, boolean o date'),
  body('variables.*.origen')
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
 * Crea un nuevo método de cálculo de tarifa
 */
export const createTarifaMetodo = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Datos de entrada inválidos', 400, errors.array());
      return;
    }

    const {
      codigo,
      nombre,
      descripcion,
      formulaBase,
      variables,
      prioridad,
      activo,
      requiereDistancia,
      requierePalets,
      permiteFormulasPersonalizadas,
      configuracion,
    } = req.body;

    // Verificar que el código no exista
    const metodoExistente = await TarifaMetodo.findOne({
      codigo: codigo.toUpperCase(),
    });

    if (metodoExistente) {
      ApiResponse.error(res, `Ya existe un método con el código ${codigo}`, 409);
      return;
    }

    // Crear nuevo método
    const nuevoMetodo = new TarifaMetodo({
      codigo: codigo.toUpperCase(),
      nombre,
      descripcion,
      formulaBase,
      variables: variables || [],
      prioridad: prioridad || 100,
      activo: activo !== undefined ? activo : true,
      requiereDistancia: requiereDistancia || false,
      requierePalets: requierePalets || false,
      permiteFormulasPersonalizadas:
        permiteFormulasPersonalizadas !== undefined ? permiteFormulasPersonalizadas : true,
      configuracion: configuracion || {},
    });

    // Validar la fórmula
    const formulaEsValida = nuevoMetodo.validarFormula(formulaBase);
    if (!formulaEsValida) {
      ApiResponse.error(res, 'La fórmula base no es válida', 400);
      return;
    }

    await nuevoMetodo.save();

    logger.info(`[TarifaMetodo] Método creado: ${nuevoMetodo.codigo}`, {
      metodoId: nuevoMetodo._id,
      usuario: (req as unknown).user?.email,
    });

    ApiResponse.success(res, nuevoMetodo, 'Método de tarifa creado exitosamente', 201);
  } catch (error: unknown) {
    logger.error('[TarifaMetodo] Error al crear método:', error);

    if ((error as any).name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: unknown) => ({
        field: err.path,
        message: err.message,
      }));
      ApiResponse.error(res, 'Error de validación', 400, validationErrors);
      return;
    }

    if ((error as any).code === 11000) {
      ApiResponse.error(res, 'El código del método ya existe', 409);
      return;
    }

    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};
