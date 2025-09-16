import { Request, Response } from 'express';
import ReglaTarifa from '../../models/ReglaTarifa';
import Cliente from '../../models/Cliente';
import TarifaMetodo from '../../models/TarifaMetodo';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';

/**
 * Validators para crear regla de tarifa
 */
export const createReglaTarifaValidators = [
  body('codigo')
    .notEmpty()
    .withMessage('El código es requerido')
    .matches(/^[A-Z][A-Z0-9_]*$/)
    .withMessage(
      'El código debe empezar con letra mayúscula y contener solo letras mayúsculas, números y guiones bajos'
    ),
  body('nombre').notEmpty().withMessage('El nombre es requerido').trim(),
  body('descripcion').notEmpty().withMessage('La descripción es requerida').trim(),
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
  body('condiciones').isArray().withMessage('Las condiciones deben ser un array'),
  body('condiciones.*.campo').notEmpty().withMessage('El campo de la condición es requerido'),
  body('condiciones.*.operador')
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
  body('condiciones.*.valor').notEmpty().withMessage('El valor de la condición es requerido'),
  body('operadorLogico')
    .optional()
    .isIn(['AND', 'OR'])
    .withMessage('Operador lógico debe ser AND o OR'),
  body('modificadores').isArray().withMessage('Los modificadores deben ser un array'),
  body('modificadores.*.tipo')
    .isIn(['porcentaje', 'fijo', 'formula'])
    .withMessage('Tipo de modificador debe ser porcentaje, fijo o formula'),
  body('modificadores.*.aplicarA')
    .isIn(['tarifa', 'peaje', 'total', 'extras'])
    .withMessage('AplicarA debe ser tarifa, peaje, total o extras'),
  body('prioridad')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La prioridad debe ser un número mayor a 0'),
  body('fechaInicioVigencia')
    .notEmpty()
    .withMessage('La fecha de inicio de vigencia es requerida')
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
 * Crea una nueva regla de tarifa
 */
// Funciones auxiliares para reducir complejidad

const validateHorarios = (horariosAplicacion: unknown, res: Response): boolean => {
  if (!horariosAplicacion) return true;

  const { horaInicio, horaFin } = horariosAplicacion as { horaInicio: string; horaFin: string };
  if (!horaInicio || !horaFin) {
    ApiResponse.error(
      res,
      'Debe especificar hora de inicio y fin para horarios de aplicación',
      400
    );
    return false;
  }

  const formatoHora = /^([01]?\d|2[0-3]):[0-5]\d$/;
  if (!formatoHora.test(horaInicio) || !formatoHora.test(horaFin)) {
    ApiResponse.error(res, 'Las horas deben estar en formato HH:MM', 400);
    return false;
  }

  return true;
};

const validateDiasSemana = (diasSemana: unknown, res: Response): boolean => {
  if (!diasSemana) return true;

  const dias = diasSemana as number[];
  if (dias.length > 0) {
    const diasValidos = dias.every((dia: number) => dia >= 0 && dia <= 6);
    if (!diasValidos) {
      ApiResponse.error(
        res,
        'Los días de la semana deben ser números entre 0 (domingo) y 6 (sábado)',
        400
      );
      return false;
    }
  }

  return true;
};

const buildBasicFields = (reqBody: Record<string, unknown>) => ({
  codigo: (reqBody.codigo as string).toUpperCase(),
  nombre: reqBody.nombre,
  descripcion: reqBody.descripcion,
  cliente: reqBody.cliente || undefined,
  metodoCalculo: reqBody.metodoCalculo || undefined,
  condiciones: reqBody.condiciones || [],
  operadorLogico: reqBody.operadorLogico || 'AND',
  modificadores: reqBody.modificadores || [],
});

const buildConfigFields = (reqBody: Record<string, unknown>) => ({
  prioridad: reqBody.prioridad || 100,
  activa: reqBody.activa !== undefined ? reqBody.activa : true,
  aplicarEnCascada: reqBody.aplicarEnCascada !== undefined ? reqBody.aplicarEnCascada : true,
  excluirOtrasReglas: reqBody.excluirOtrasReglas || false,
  diasSemana: reqBody.diasSemana || undefined,
  horariosAplicacion: reqBody.horariosAplicacion || undefined,
  temporadas: reqBody.temporadas || undefined,
});

const buildDateFields = (reqBody: Record<string, unknown>) => ({
  fechaInicioVigencia: new Date(reqBody.fechaInicioVigencia as string),
  fechaFinVigencia: reqBody.fechaFinVigencia
    ? new Date(reqBody.fechaFinVigencia as string)
    : undefined,
  estadisticas: { vecesAplicada: 0, montoTotalModificado: 0 },
});

const createReglaTarifaObject = (reqBody: Record<string, unknown>) => {
  const basicFields = buildBasicFields(reqBody);
  const configFields = buildConfigFields(reqBody);
  const dateFields = buildDateFields(reqBody);

  return new ReglaTarifa({ ...basicFields, ...configFields, ...dateFields });
};

const handleValidationError = (error: unknown, res: Response) => {
  const err = error as { name: string; errors: Record<string, unknown>; code: number };

  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map((errorItem: unknown) => {
      const validationError = errorItem as { path: string; message: string };
      return {
        field: validationError.path,
        message: validationError.message,
      };
    });
    ApiResponse.error(res, 'Error de validación', 400, { errors: validationErrors });
    return;
  }

  if (err.code === 11000) {
    ApiResponse.error(res, 'El código de la regla ya existe', 409);
    return;
  }

  ApiResponse.error(res, 'Error interno del servidor', 500);
};

export const createReglaTarifa = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Datos de entrada inválidos', 400, { errors: errors.array() });
      return;
    }

    const { codigo } = req.body;

    // Verificar que el código no exista
    const reglaExistente = await ReglaTarifa.findOne({
      codigo: codigo.toUpperCase(),
    });

    if (reglaExistente) {
      ApiResponse.error(res, `Ya existe una regla con el código ${codigo}`, 409);
      return;
    }

    // Validaciones específicas
    if (!validateHorarios(req.body.horariosAplicacion, res)) return;
    if (!validateDiasSemana(req.body.diasSemana, res)) return;

    // Crear nueva regla
    const nuevaRegla = createReglaTarifaObject(req.body);
    await nuevaRegla.save();

    logger.info(`[ReglaTarifa] Regla creada: ${nuevaRegla.codigo}`, {
      reglaId: nuevaRegla._id,
      cliente: req.body.cliente || 'General',
      metodoCalculo: req.body.metodoCalculo || 'Todos',
      usuario: (req as { user?: { email: string } }).user?.email,
    });

    // Poblar referencias para la respuesta
    const reglaConReferencias = await ReglaTarifa.findById(nuevaRegla._id)
      .populate('cliente', 'nombre razonSocial')
      .lean();

    ApiResponse.success(res, reglaConReferencias, 'Regla de tarifa creada exitosamente', 201);
  } catch (error) {
    logger.error('[ReglaTarifa] Error al crear regla:', error);
    handleValidationError(error, res);
  }
};
