import { Request, Response } from 'express';
import ReglaTarifa from '../../models/ReglaTarifa';
import Cliente from '../../models/Cliente';
import TarifaMetodo from '../../models/TarifaMetodo';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { param, body, validationResult } from 'express-validator';
import { Types } from 'mongoose';

/**
 * Validators para actualizar regla de tarifa
 */
export const updateReglaTarifaValidators = [
  param('id').custom((value) => {
    if (!Types.ObjectId.isValid(value)) {
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
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('ID de cliente no válido');
      }
      if (value) {
        const cliente = await Cliente.findById(value);
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
        const metodo = await TarifaMetodo.findByCodigoActivo(value);
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
      if (fechaFin && req.body.fechaInicioVigencia) {
        const inicio = new Date(req.body.fechaInicioVigencia);
        const fin = new Date(fechaFin);
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
export const updateReglaTarifa = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Datos de entrada inválidos', 400, errors.array());
      return;
    }

    const { id } = req.params;

    // Buscar la regla actual
    const reglaActual = await ReglaTarifa.findById(id);
    if (!reglaActual) {
      ApiResponse.error(res, 'Regla de tarifa no encontrada', 404);
      return;
    }

    const {
      codigo,
      nombre,
      descripcion,
      cliente,
      metodoCalculo,
      condiciones,
      operadorLogico,
      modificadores,
      prioridad,
      activa,
      fechaInicioVigencia,
      fechaFinVigencia,
      aplicarEnCascada,
      excluirOtrasReglas,
      diasSemana,
      horariosAplicacion,
      temporadas,
    } = req.body;

    // Si se está cambiando el código, verificar que no exista otro con el mismo
    if (codigo && codigo.toUpperCase() !== reglaActual.codigo) {
      const reglaExistente = await ReglaTarifa.findOne({
        codigo: codigo.toUpperCase(),
        _id: { $ne: id },
      });

      if (reglaExistente) {
        ApiResponse.error(res, `Ya existe otra regla con el código ${codigo}`, 409);
        return;
      }
    }

    // Validar horarios si se proporcionan
    if (horariosAplicacion) {
      const { horaInicio, horaFin } = horariosAplicacion;
      if (horaInicio && horaFin) {
        const formatoHora = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!formatoHora.test(horaInicio) || !formatoHora.test(horaFin)) {
          ApiResponse.error(res, 'Las horas deben estar en formato HH:MM', 400);
          return;
        }
      }
    }

    // Validar días de la semana si se proporcionan
    if (diasSemana && diasSemana.length > 0) {
      const diasValidos = diasSemana.every((dia: number) => dia >= 0 && dia <= 6);
      if (!diasValidos) {
        ApiResponse.error(
          res,
          'Los días de la semana deben ser números entre 0 (domingo) y 6 (sábado)',
          400
        );
        return;
      }
    }

    // Construir objeto de actualización
    const actualizacion: any = {};

    if (codigo !== undefined) actualizacion.codigo = codigo.toUpperCase();
    if (nombre !== undefined) actualizacion.nombre = nombre;
    if (descripcion !== undefined) actualizacion.descripcion = descripcion;
    if (cliente !== undefined) actualizacion.cliente = cliente || undefined;
    if (metodoCalculo !== undefined) actualizacion.metodoCalculo = metodoCalculo || undefined;
    if (condiciones !== undefined) actualizacion.condiciones = condiciones;
    if (operadorLogico !== undefined) actualizacion.operadorLogico = operadorLogico;
    if (modificadores !== undefined) actualizacion.modificadores = modificadores;
    if (prioridad !== undefined) actualizacion.prioridad = prioridad;
    if (activa !== undefined) actualizacion.activa = activa;
    if (fechaInicioVigencia !== undefined)
      actualizacion.fechaInicioVigencia = new Date(fechaInicioVigencia);
    if (fechaFinVigencia !== undefined)
      actualizacion.fechaFinVigencia = fechaFinVigencia ? new Date(fechaFinVigencia) : undefined;
    if (aplicarEnCascada !== undefined) actualizacion.aplicarEnCascada = aplicarEnCascada;
    if (excluirOtrasReglas !== undefined) actualizacion.excluirOtrasReglas = excluirOtrasReglas;
    if (diasSemana !== undefined) actualizacion.diasSemana = diasSemana;
    if (horariosAplicacion !== undefined) actualizacion.horariosAplicacion = horariosAplicacion;
    if (temporadas !== undefined) actualizacion.temporadas = temporadas;

    // Validar fechas de vigencia si se están actualizando
    const fechaInicio = actualizacion.fechaInicioVigencia || reglaActual.fechaInicioVigencia;
    const fechaFin =
      actualizacion.fechaFinVigencia !== undefined
        ? actualizacion.fechaFinVigencia
        : reglaActual.fechaFinVigencia;

    if (fechaFin && fechaFin <= fechaInicio) {
      ApiResponse.error(res, 'La fecha de fin debe ser posterior a la fecha de inicio', 400);
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
      usuario: (req as any).user?.email,
    });

    // Si se desactivó la regla y tenía estadísticas de uso, registrar el motivo
    if (
      activa === false &&
      reglaActual.activa === true &&
      reglaActual.estadisticas.vecesAplicada > 0
    ) {
      logger.warn(`[ReglaTarifa] Regla con uso histórico desactivada: ${reglaActualizada.codigo}`, {
        vecesAplicada: reglaActual.estadisticas.vecesAplicada,
        montoTotal: reglaActual.estadisticas.montoTotalModificado,
      });
    }

    ApiResponse.success(res, reglaActualizada, 'Regla de tarifa actualizada exitosamente');
  } catch (error: any) {
    logger.error('[ReglaTarifa] Error al actualizar regla:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
      }));
      ApiResponse.error(res, 'Error de validación', 400, validationErrors);
      return;
    }

    if (error.code === 11000) {
      ApiResponse.error(res, 'El código de la regla ya existe', 409);
      return;
    }

    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};
