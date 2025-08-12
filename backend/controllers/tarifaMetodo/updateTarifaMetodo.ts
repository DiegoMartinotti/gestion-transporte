import { Request, Response } from 'express';
import TarifaMetodo from '../../models/TarifaMetodo';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { param, body, validationResult } from 'express-validator';
import { Types } from 'mongoose';

/**
 * Validators para actualizar método de tarifa
 */
export const updateTarifaMetodoValidators = [
  param('id').custom((value) => {
    if (!Types.ObjectId.isValid(value)) {
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
    .matches(/^[A-Za-z][A-Za-z0-9_]*$/)
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
export const updateTarifaMetodo = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Datos de entrada inválidos', 400, errors.array());
      return;
    }

    const { id } = req.params;

    // Buscar el método actual
    const metodoActual = await TarifaMetodo.findById(id);
    if (!metodoActual) {
      ApiResponse.error(res, 'Método de tarifa no encontrado', 404);
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

    // Si se está cambiando el código, verificar que no exista otro con el mismo
    if (codigo && codigo.toUpperCase() !== metodoActual.codigo) {
      const metodoExistente = await TarifaMetodo.findOne({
        codigo: codigo.toUpperCase(),
        _id: { $ne: id },
      });

      if (metodoExistente) {
        ApiResponse.error(res, `Ya existe otro método con el código ${codigo}`, 409);
        return;
      }
    }

    // Construir objeto de actualización
    const actualizacion: any = {};

    if (codigo !== undefined) actualizacion.codigo = codigo.toUpperCase();
    if (nombre !== undefined) actualizacion.nombre = nombre;
    if (descripcion !== undefined) actualizacion.descripcion = descripcion;
    if (formulaBase !== undefined) actualizacion.formulaBase = formulaBase;
    if (variables !== undefined) actualizacion.variables = variables;
    if (prioridad !== undefined) actualizacion.prioridad = prioridad;
    if (activo !== undefined) actualizacion.activo = activo;
    if (requiereDistancia !== undefined) actualizacion.requiereDistancia = requiereDistancia;
    if (requierePalets !== undefined) actualizacion.requierePalets = requierePalets;
    if (permiteFormulasPersonalizadas !== undefined)
      actualizacion.permiteFormulasPersonalizadas = permiteFormulasPersonalizadas;
    if (configuracion !== undefined) actualizacion.configuracion = configuracion;

    // Si se actualiza la fórmula, validarla
    const formulaParaValidar = formulaBase || metodoActual.formulaBase;
    if (formulaBase) {
      // Crear un método temporal para validación
      const metodoTemporal = new TarifaMetodo({
        ...metodoActual.toObject(),
        ...actualizacion,
      });

      const formulaEsValida = metodoTemporal.validarFormula(formulaParaValidar);
      if (!formulaEsValida) {
        ApiResponse.error(res, 'La fórmula actualizada no es válida', 400);
        return;
      }
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
      usuario: (req as any).user?.email,
    });

    // Información adicional para la respuesta
    const respuesta = {
      ...metodoActualizado.toObject(),
      informacionAdicional: {
        variablesDisponibles: metodoActualizado.obtenerVariablesDisponibles(),
        formulaValida: metodoActualizado.validarFormula(metodoActualizado.formulaBase),
      },
    };

    ApiResponse.success(res, respuesta, 'Método de tarifa actualizado exitosamente');
  } catch (error: any) {
    logger.error('[TarifaMetodo] Error al actualizar método:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
      }));
      ApiResponse.error(res, 'Error de validación', 400, validationErrors);
      return;
    }

    if (error.code === 11000) {
      ApiResponse.error(res, 'El código del método ya existe', 409);
      return;
    }

    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};
