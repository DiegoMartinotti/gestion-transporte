import { Request, Response } from 'express';
import ReglaTarifa from '../../models/ReglaTarifa';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { query, validationResult } from 'express-validator';
import { Types } from 'mongoose';

/**
 * Validators para consulta de reglas de tarifa
 */
export const getAllReglasTarifaValidators = [
  query('cliente')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('ID de cliente no válido');
      }
      return true;
    }),
  query('metodoCalculo')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('El método de cálculo no puede estar vacío'),
  query('activa').optional().isBoolean().withMessage('El filtro activa debe ser verdadero o falso'),
  query('vigente')
    .optional()
    .isBoolean()
    .withMessage('El filtro vigente debe ser verdadero o falso'),
  query('fecha').optional().isISO8601().withMessage('La fecha debe ser válida'),
  query('busqueda')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('La búsqueda debe tener al menos 1 caracter'),
  query('limite')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser entre 1 y 100'),
  query('pagina').optional().isInt({ min: 1 }).withMessage('La página debe ser mayor a 0'),
];

/**
 * Obtiene todas las reglas de tarifa con filtros opcionales
 */
// eslint-disable-next-line complexity, max-lines-per-function
export const getAllReglasTarifa = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar parámetros de consulta
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Parámetros de consulta inválidos', 400, errors.array());
      return;
    }

    const { cliente, metodoCalculo, activa, vigente, fecha, busqueda, limite, pagina } = req.query;

    // Construir filtros
    const filtros: unknown = {};

    if (cliente) {
      filtros.cliente = cliente;
    }

    if (metodoCalculo) {
      filtros.metodoCalculo = metodoCalculo;
    }

    if (activa !== undefined) {
      filtros.activa = activa === 'true';
    }

    // Filtrar por vigencia
    if (vigente === 'true') {
      const fechaReferencia = fecha ? new Date(fecha as string) : new Date();
      filtros.fechaInicioVigencia = { $lte: fechaReferencia };
      filtros.$or = [
        { fechaFinVigencia: { $gte: fechaReferencia } },
        { fechaFinVigencia: { $exists: false } },
      ];
    } else if (vigente === 'false') {
      const fechaReferencia = fecha ? new Date(fecha as string) : new Date();
      filtros.$or = [
        { fechaInicioVigencia: { $gt: fechaReferencia } },
        { fechaFinVigencia: { $lt: fechaReferencia } },
      ];
    }

    // Búsqueda por texto en nombre, código o descripción
    if (busqueda) {
      filtros.$and = filtros.$and || [];
      filtros.$and.push({
        $or: [
          { codigo: { $regex: busqueda, $options: 'i' } },
          { nombre: { $regex: busqueda, $options: 'i' } },
          { descripcion: { $regex: busqueda, $options: 'i' } },
        ],
      });
    }

    // Configurar paginación
    const limitNum = limite ? parseInt(limite as string) : 50;
    const paginaNum = pagina ? parseInt(pagina as string) : 1;
    const skip = (paginaNum - 1) * limitNum;

    // Ejecutar consulta con paginación
    const [reglas, total] = await Promise.all([
      ReglaTarifa.find(filtros)
        .populate('cliente', 'nombre razonSocial')
        .sort({ prioridad: -1, fechaInicioVigencia: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ReglaTarifa.countDocuments(filtros),
    ]);

    // Calcular metadatos de paginación
    const totalPaginas = Math.ceil(total / limitNum);
    const hayPaginaSiguiente = paginaNum < totalPaginas;
    const hayPaginaAnterior = paginaNum > 1;

    // Enriquecer reglas con información de vigencia actual
    const fechaActual = new Date();
    const reglasEnriquecidas = reglas.map((regla) => ({
      ...regla,
      esVigente: esReglVigente(regla, fechaActual),
      diasRestantesVigencia: calcularDiasRestantesVigencia(regla, fechaActual),
    }));

    // Calcular estadísticas generales
    const fechaRef = fecha ? new Date(fecha as string) : fechaActual;
    const estadisticas = {
      totalActivas: await ReglaTarifa.countDocuments({ activa: true }),
      totalInactivas: await ReglaTarifa.countDocuments({ activa: false }),
      vigentesHoy: await contarReglasVigentes(fechaRef),
      porCliente: await obtenerEstadisticasPorCliente(),
      porMetodo: await obtenerEstadisticasPorMetodo(),
    };

    const resultado = {
      reglas: reglasEnriquecidas,
      paginacion: {
        total,
        pagina: paginaNum,
        limite: limitNum,
        totalPaginas,
        hayPaginaSiguiente,
        hayPaginaAnterior,
      },
      filtros: {
        cliente,
        metodoCalculo,
        activa,
        vigente,
        fecha,
        busqueda,
      },
      estadisticas,
    };

    logger.debug(
      `[ReglaTarifa] Consulta realizada: ${reglas.length} resultados de ${total} total`,
      {
        filtros,
        usuario: (req as unknown).user?.email,
      }
    );

    ApiResponse.success(res, resultado, 'Reglas de tarifa obtenidas exitosamente');
  } catch (error: unknown) {
    logger.error('[ReglaTarifa] Error al obtener reglas:', error);
    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};

/**
 * Verifica si una regla está vigente en una fecha específica
 */
function esReglVigente(regla: unknown, fecha: Date): boolean {
  if (!regla.activa) return false;

  if (regla.fechaInicioVigencia > fecha) return false;

  return !(regla.fechaFinVigencia && regla.fechaFinVigencia < fecha);

  return true;
}

/**
 * Calcula los días restantes de vigencia
 */
function calcularDiasRestantesVigencia(regla: unknown, fecha: Date): number | null {
  if (!regla.fechaFinVigencia) return null;

  const fechaFin = new Date(regla.fechaFinVigencia);
  const diferencia = fechaFin.getTime() - fecha.getTime();
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

  return dias >= 0 ? dias : 0;
}

/**
 * Cuenta reglas vigentes en una fecha específica
 */
async function contarReglasVigentes(fecha: Date): Promise<number> {
  return await ReglaTarifa.countDocuments({
    activa: true,
    fechaInicioVigencia: { $lte: fecha },
    $or: [{ fechaFinVigencia: { $gte: fecha } }, { fechaFinVigencia: { $exists: false } }],
  });
}

/**
 * Obtiene estadísticas por cliente
 */
async function obtenerEstadisticasPorCliente(): Promise<unknown[]> {
  return await ReglaTarifa.aggregate([
    { $match: { activa: true } },
    {
      $group: {
        _id: '$cliente',
        cantidad: { $sum: 1 },
        promedioVecesAplicada: { $avg: '$estadisticas.vecesAplicada' },
      },
    },
    {
      $lookup: {
        from: 'clientes',
        localField: '_id',
        foreignField: '_id',
        as: 'cliente',
      },
    },
    {
      $project: {
        clienteId: '$_id',
        clienteNombre: { $arrayElemAt: ['$cliente.nombre', 0] },
        cantidad: 1,
        promedioVecesAplicada: { $round: ['$promedioVecesAplicada', 2] },
      },
    },
    { $sort: { cantidad: -1 } },
    { $limit: 10 },
  ]);
}

/**
 * Obtiene estadísticas por método de cálculo
 */
async function obtenerEstadisticasPorMetodo(): Promise<unknown[]> {
  return await ReglaTarifa.aggregate([
    { $match: { activa: true, metodoCalculo: { $exists: true } } },
    {
      $group: {
        _id: '$metodoCalculo',
        cantidad: { $sum: 1 },
        totalVecesAplicada: { $sum: '$estadisticas.vecesAplicada' },
      },
    },
    {
      $project: {
        metodo: '$_id',
        cantidad: 1,
        totalVecesAplicada: 1,
      },
    },
    { $sort: { cantidad: -1 } },
    { $limit: 10 },
  ]);
}
