import { Request, Response } from 'express';
import tarifaEngine, { IContextoCalculo } from '../../services/tarifaEngine';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';

interface RequestWithUser extends Request {
  user?: {
    email: string;
  };
}

interface CalculoRequestBody {
  clienteId: string;
  origenId: string;
  destinoId: string;
  fecha?: string;
  tipoTramo?: string;
  tipoUnidad: string;
  metodoCalculo?: string;
  palets?: number;
  peso?: number;
  volumen?: number;
  cantidadBultos?: number;
  urgencia?: string;
  vehiculos?: unknown[];
  extras?: unknown;
  aplicarReglas?: boolean;
  usarCache?: boolean;
  incluirDesgloseCalculo?: boolean;
}

interface ResultadoCalculo {
  total: number;
  metodoUtilizado: string;
  cacheUtilizado: boolean;
  reglasAplicadas?: unknown[];
}

interface ErrorCalculoTarifa {
  message: string;
}

/**
 * Validators para cálculo de tarifa
 */
export const calculateTarifaValidators = [
  body('clienteId')
    .notEmpty()
    .withMessage('El ID del cliente es requerido')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('ID de cliente no válido');
      }
      return true;
    }),
  body('origenId')
    .notEmpty()
    .withMessage('El ID del origen es requerido')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('ID de origen no válido');
      }
      return true;
    }),
  body('destinoId')
    .notEmpty()
    .withMessage('El ID del destino es requerido')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('ID de destino no válido');
      }
      return true;
    }),
  body('fecha').optional().isISO8601().withMessage('La fecha debe ser válida'),
  body('tipoTramo')
    .optional()
    .isIn(['TRMC', 'TRMI'])
    .withMessage('Tipo de tramo debe ser TRMC o TRMI'),
  body('tipoUnidad').notEmpty().withMessage('El tipo de unidad es requerido').trim(),
  body('metodoCalculo')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('El método de cálculo no puede estar vacío'),
  body('palets')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Los palets deben ser un número positivo'),
  body('peso').optional().isFloat({ min: 0 }).withMessage('El peso debe ser un número positivo'),
  body('volumen')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El volumen debe ser un número positivo'),
  body('cantidadBultos')
    .optional()
    .isInt({ min: 0 })
    .withMessage('La cantidad de bultos debe ser un número entero positivo'),
  body('urgencia')
    .optional()
    .isIn(['Normal', 'Urgente', 'Critico'])
    .withMessage('La urgencia debe ser Normal, Urgente o Critico'),
  body('vehiculos').optional().isArray().withMessage('Los vehículos deben ser un array'),
  body('vehiculos.*.tipo').optional().notEmpty().withMessage('El tipo de vehículo es requerido'),
  body('vehiculos.*.cantidad')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La cantidad de vehículos debe ser mayor a 0'),
  body('aplicarReglas')
    .optional()
    .isBoolean()
    .withMessage('AplicarReglas debe ser verdadero o falso'),
  body('usarCache').optional().isBoolean().withMessage('UsarCache debe ser verdadero o falso'),
  body('incluirDesgloseCalculo')
    .optional()
    .isBoolean()
    .withMessage('IncluirDesgloseCalculo debe ser verdadero o falso'),
];

/**
 * Construye el contexto de cálculo a partir de los datos del request
 */
const construirContextoCalculo = (body: CalculoRequestBody): IContextoCalculo => {
  const {
    clienteId,
    origenId,
    destinoId,
    fecha,
    tipoTramo,
    tipoUnidad,
    metodoCalculo,
    palets,
    peso,
    volumen,
    cantidadBultos,
    urgencia,
    vehiculos,
    extras,
    aplicarReglas,
    usarCache,
    incluirDesgloseCalculo,
  } = body;

  return {
    clienteId: new Types.ObjectId(clienteId),
    origenId: new Types.ObjectId(origenId),
    destinoId: new Types.ObjectId(destinoId),
    fecha: fecha ? new Date(fecha) : new Date(),
    tipoTramo: tipoTramo || 'TRMC',
    tipoUnidad,
    metodoCalculo,
    palets,
    peso,
    volumen,
    cantidadBultos,
    vehiculos,
    urgencia,
    extras,
    aplicarReglas: aplicarReglas !== false, // Por defecto true
    usarCache: usarCache !== false, // Por defecto true
    incluirDesgloseCalculo: incluirDesgloseCalculo || false,
  };
};

/**
 * Construye la respuesta con metadatos de la solicitud
 */
const construirRespuestaConMetadatos = (
  resultado: ResultadoCalculo,
  contexto: IContextoCalculo,
  tiempoTotal: number,
  userEmail: string
) => {
  return {
    ...resultado,
    metadatos: {
      solicitud: {
        timestamp: new Date(),
        tiempoEjecucion: tiempoTotal,
        usuario: userEmail || 'desconocido',
      },
      contexto: {
        clienteId: contexto.clienteId,
        origenId: contexto.origenId,
        destinoId: contexto.destinoId,
        fecha: contexto.fecha,
        tipoUnidad: contexto.tipoUnidad,
        metodoCalculo: contexto.metodoCalculo || 'automático',
      },
      configuracion: {
        aplicarReglas: contexto.aplicarReglas,
        usarCache: contexto.usarCache,
        incluirDesglose: contexto.incluirDesgloseCalculo,
      },
    },
  };
};

/**
 * Determina el código de estado HTTP y mensaje basado en el error
 */
const determinarTipoError = (error: ErrorCalculoTarifa) => {
  let statusCode = 500;
  let mensaje = 'Error interno del servidor';

  if (error.message.includes('no encontrado')) {
    statusCode = 404;
    mensaje = error.message;
  } else if (error.message.includes('inválido') || error.message.includes('requerido')) {
    statusCode = 400;
    mensaje = error.message;
  }

  return { statusCode, mensaje };
};

/**
 * Calcula la tarifa usando el motor de tarifas
 */
export const calculateTarifa = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Datos de entrada inválidos', 400, { errors: errors.array() });
      return;
    }

    // Construir contexto de cálculo
    const contexto = construirContextoCalculo(req.body as CalculoRequestBody);

    logger.info('[TarifaEngine] Iniciando cálculo de tarifa', {
      cliente: contexto.clienteId,
      origen: contexto.origenId,
      destino: contexto.destinoId,
      metodo: contexto.metodoCalculo || 'auto',
      usuario: req.user?.email,
    });

    // Ejecutar cálculo
    const startTime = Date.now();
    const resultado = await tarifaEngine.calcular(contexto);
    const tiempoTotal = Date.now() - startTime;

    // Construir respuesta con metadatos
    const userEmail = req.user?.email || 'desconocido';
    const respuesta = construirRespuestaConMetadatos(resultado, contexto, tiempoTotal, userEmail);

    logger.info('[TarifaEngine] Cálculo completado', {
      resultado: resultado.total,
      metodo: resultado.metodoUtilizado,
      tiempoEjecucion: tiempoTotal,
      cache: resultado.cacheUtilizado,
      reglas: resultado.reglasAplicadas?.length || 0,
    });

    ApiResponse.success(res, respuesta, 'Tarifa calculada exitosamente');
  } catch (error: unknown) {
    logger.error('[TarifaEngine] Error en cálculo de tarifa:', error);

    // Determinar tipo de error y status code apropiado
    const errorObj = error as ErrorCalculoTarifa;
    const { statusCode, mensaje } = determinarTipoError(errorObj);

    const errorResponse = {
      error: errorObj.message,
      timestamp: new Date(),
      contexto: {
        clienteId: (req.body as CalculoRequestBody).clienteId,
        origenId: (req.body as CalculoRequestBody).origenId,
        destinoId: (req.body as CalculoRequestBody).destinoId,
      },
    };

    ApiResponse.error(res, mensaje, statusCode, errorResponse);
  }
};
