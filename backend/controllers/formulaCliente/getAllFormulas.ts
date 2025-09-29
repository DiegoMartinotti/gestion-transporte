import { Request, Response } from 'express';
import FormulasPersonalizadasCliente from '../../models/FormulasPersonalizadasCliente';
import TarifaMetodo from '../../models/TarifaMetodo';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { query, validationResult } from 'express-validator';
import { Types } from 'mongoose';

/**
 * Validators para consulta de fórmulas
 */
export const getAllFormulasValidators = [
  query('cliente')
    .optional()
    .custom((value: unknown) => {
      if (value && !Types.ObjectId.isValid(value as string)) {
        throw new Error('ID de cliente no válido');
      }
      return true;
    }),
  query('metodoCalculo')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('El método de cálculo no puede estar vacío'),
  query('tipoUnidad')
    .optional()
    .isIn(['Sider', 'Bitren', 'General', 'Todos'])
    .withMessage('Tipo de unidad debe ser Sider, Bitren, General o Todos'),
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
  query('incluirHistorial')
    .optional()
    .isBoolean()
    .withMessage('IncluirHistorial debe ser verdadero o falso'),
  query('limite')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser entre 1 y 100'),
  query('pagina').optional().isInt({ min: 1 }).withMessage('La página debe ser mayor a 0'),
];

/**
 * Obtiene todas las fórmulas personalizadas con filtros avanzados
 * Nuevo endpoint que soporta múltiples métodos de cálculo
 */
// eslint-disable-next-line max-lines-per-function, complexity, sonarjs/cognitive-complexity
export const getAllFormulas = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar parámetros de consulta
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors = validationResult(req as any);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Parámetros de consulta inválidos', 400, { errors: errors.array() });
      return;
    }

    const {
      cliente,
      metodoCalculo,
      tipoUnidad,
      activa,
      vigente,
      fecha,
      busqueda,
      incluirHistorial,
      limite,
      pagina,
    } = req.query;

    // Construir filtros
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filtros: Record<string, any> = {};

    if (cliente) {
      filtros.clienteId = cliente;
    }

    if (metodoCalculo) {
      filtros.metodoCalculo = metodoCalculo;
    }

    if (tipoUnidad) {
      filtros.tipoUnidad = tipoUnidad;
    }

    if (activa !== undefined) {
      filtros.activa = activa === 'true';
    }

    // Filtrar por vigencia
    if (vigente === 'true') {
      const fechaReferencia = fecha ? new Date(fecha as string) : new Date();
      filtros.vigenciaDesde = { $lte: fechaReferencia };
      filtros.$or = [
        { vigenciaHasta: { $gte: fechaReferencia } },
        { vigenciaHasta: { $exists: false } },
      ];
    } else if (vigente === 'false') {
      const fechaReferencia = fecha ? new Date(fecha as string) : new Date();
      filtros.$or = [
        { vigenciaDesde: { $gt: fechaReferencia } },
        { vigenciaHasta: { $lt: fechaReferencia } },
      ];
    }

    // Búsqueda por texto
    if (busqueda) {
      filtros.$and = filtros.$and || [];
      filtros.$and.push({
        $or: [
          { nombre: { $regex: busqueda, $options: 'i' } },
          { descripcion: { $regex: busqueda, $options: 'i' } },
          { formula: { $regex: busqueda, $options: 'i' } },
        ],
      });
    }

    // Configurar paginación
    const limitNum = limite ? parseInt(limite as string) : 50;
    const paginaNum = pagina ? parseInt(pagina as string) : 1;
    const skip = (paginaNum - 1) * limitNum;

    // Configurar proyección
    let projection: Record<string, number> = {};
    if (!incluirHistorial || incluirHistorial === 'false') {
      projection = { historialCambios: 0 }; // Excluir historial por defecto para mejor rendimiento
    }

    // Ejecutar consulta con paginación
    const [formulas, total] = await Promise.all([
      FormulasPersonalizadasCliente.find(filtros, projection)
        .populate('clienteId', 'nombre razonSocial')
        .sort({ prioridad: -1, vigenciaDesde: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      FormulasPersonalizadasCliente.countDocuments(filtros),
    ]);

    // Enriquecer con información de métodos de cálculo
    const metodosUnicos = [...new Set(formulas.map((f) => f.metodoCalculo))];
    const metodosInfo = await Promise.all(
      metodosUnicos.map(async (codigo) => {
        const metodo = await TarifaMetodo.findByCodigoActivo(codigo);
        return metodo
          ? {
              codigo: metodo.codigo,
              nombre: metodo.nombre,
              descripcion: metodo.descripcion,
            }
          : {
              codigo,
              nombre: codigo,
              descripcion: 'Método legacy o no encontrado',
            };
      })
    );

    // Enriquecer fórmulas con información de vigencia
    const fechaActual = new Date();
    const formulasEnriquecidas = formulas.map((formula) => ({
      ...formula,
      esVigente: esFormulaVigente(formula, fechaActual),
      diasRestantesVigencia: calcularDiasRestantesVigencia(formula, fechaActual),
      metodoInfo: metodosInfo.find((m) => m.codigo === formula.metodoCalculo),
    }));

    // Calcular metadatos de paginación
    const totalPaginas = Math.ceil(total / limitNum);
    const hayPaginaSiguiente = paginaNum < totalPaginas;
    const hayPaginaAnterior = paginaNum > 1;

    // Estadísticas avanzadas
    const estadisticas = await calcularEstadisticas(filtros);

    const resultado = {
      formulas: formulasEnriquecidas,
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
        tipoUnidad,
        activa,
        vigente,
        fecha,
        busqueda,
      },
      metadatos: {
        metodosDisponibles: metodosInfo,
        totalMetodos: metodosUnicos.length,
      },
      estadisticas,
    };

    logger.debug(
      `[FormulasCliente] Consulta realizada: ${formulas.length} resultados de ${total} total`,
      {
        filtros,
        usuario: (req as { user?: { email?: string } }).user?.email,
      }
    );

    ApiResponse.success(res, resultado, 'Fórmulas obtenidas exitosamente');
  } catch (error: unknown) {
    logger.error('[FormulasCliente] Error al obtener fórmulas:', error);
    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};

/**
 * Verifica si una fórmula está vigente
 */
function esFormulaVigente(
  formula: { activa: boolean; vigenciaDesde: Date; vigenciaHasta?: Date },
  fecha: Date
): boolean {
  if (!formula.activa) return false;

  if (formula.vigenciaDesde > fecha) return false;

  return !formula.vigenciaHasta || formula.vigenciaHasta >= fecha;
}

/**
 * Calcula días restantes de vigencia
 */
function calcularDiasRestantesVigencia(
  formula: { vigenciaHasta?: Date },
  fecha: Date
): number | null {
  if (!formula.vigenciaHasta) return null;

  const fechaFin = new Date(formula.vigenciaHasta);
  const diferencia = fechaFin.getTime() - fecha.getTime();
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

  return dias >= 0 ? dias : 0;
}

/**
 * Calcula estadísticas avanzadas
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function calcularEstadisticas(filtrosBase: Record<string, any>): Promise<any> {
  // Estadísticas generales
  const [totalActivas, totalInactivas, porMetodo, porTipoUnidad, porCliente] = await Promise.all([
    FormulasPersonalizadasCliente.countDocuments({ ...filtrosBase, activa: true }),
    FormulasPersonalizadasCliente.countDocuments({ ...filtrosBase, activa: false }),
    obtenerEstadisticasPorMetodo(filtrosBase),
    obtenerEstadisticasPorTipoUnidad(filtrosBase),
    obtenerEstadisticasPorCliente(filtrosBase),
  ]);

  return {
    generales: {
      totalActivas,
      totalInactivas,
      total: totalActivas + totalInactivas,
    },
    distribucion: {
      porMetodo,
      porTipoUnidad,
      porCliente: porCliente.slice(0, 10), // Top 10 clientes
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function obtenerEstadisticasPorMetodo(filtrosBase: Record<string, any>): Promise<unknown[]> {
  return await FormulasPersonalizadasCliente.aggregate([
    { $match: filtrosBase },
    {
      $group: {
        _id: '$metodoCalculo',
        cantidad: { $sum: 1 },
        activas: { $sum: { $cond: ['$activa', 1, 0] } },
        promedioUso: { $avg: '$estadisticas.vecesUtilizada' },
      },
    },
    {
      $project: {
        metodo: '$_id',
        cantidad: 1,
        activas: 1,
        inactivas: { $subtract: ['$cantidad', '$activas'] },
        promedioUso: { $round: ['$promedioUso', 2] },
      },
    },
    { $sort: { cantidad: -1 } },
  ]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function obtenerEstadisticasPorTipoUnidad(
  filtrosBase: Record<string, unknown>
): Promise<unknown[]> {
  return await FormulasPersonalizadasCliente.aggregate([
    { $match: filtrosBase },
    {
      $group: {
        _id: '$tipoUnidad',
        cantidad: { $sum: 1 },
        activas: { $sum: { $cond: ['$activa', 1, 0] } },
      },
    },
    {
      $project: {
        tipoUnidad: '$_id',
        cantidad: 1,
        activas: 1,
      },
    },
    { $sort: { cantidad: -1 } },
  ]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function obtenerEstadisticasPorCliente(filtrosBase: Record<string, any>): Promise<unknown[]> {
  return await FormulasPersonalizadasCliente.aggregate([
    { $match: filtrosBase },
    {
      $group: {
        _id: '$clienteId',
        cantidad: { $sum: 1 },
        activas: { $sum: { $cond: ['$activa', 1, 0] } },
        totalUso: { $sum: '$estadisticas.vecesUtilizada' },
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
        activas: 1,
        totalUso: 1,
      },
    },
    { $sort: { cantidad: -1 } },
  ]);
}
