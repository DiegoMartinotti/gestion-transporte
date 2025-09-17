import { Request, Response } from 'express';
import TarifaMetodo from '../../models/TarifaMetodo';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { query, validationResult } from 'express-validator';

/**
 * Validators para consulta de métodos de tarifa
 */
export const getAllTarifaMetodosValidators = [
  query('activo').optional().isBoolean().withMessage('El filtro activo debe ser verdadero o falso'),
  query('requiereDistancia')
    .optional()
    .isBoolean()
    .withMessage('El filtro requiereDistancia debe ser verdadero o falso'),
  query('requierePalets')
    .optional()
    .isBoolean()
    .withMessage('El filtro requierePalets debe ser verdadero o falso'),
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
 * Obtiene todos los métodos de cálculo de tarifa con filtros opcionales
 */
export const getAllTarifaMetodos = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar parámetros de consulta
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Parámetros de consulta inválidos', 400, errors.array());
      return;
    }

    const { activo, requiereDistancia, requierePalets, busqueda, limite, pagina } = req.query;

    // Construir filtros
    const filtros: unknown = {};

    if (activo !== undefined) {
      filtros.activo = activo === 'true';
    }

    if (requiereDistancia !== undefined) {
      filtros.requiereDistancia = requiereDistancia === 'true';
    }

    if (requierePalets !== undefined) {
      filtros.requierePalets = requierePalets === 'true';
    }

    // Búsqueda por texto en nombre, código o descripción
    if (busqueda) {
      filtros.$or = [
        { codigo: { $regex: busqueda, $options: 'i' } },
        { nombre: { $regex: busqueda, $options: 'i' } },
        { descripcion: { $regex: busqueda, $options: 'i' } },
      ];
    }

    // Configurar paginación
    const limitNum = limite ? parseInt(limite as string) : 50;
    const paginaNum = pagina ? parseInt(pagina as string) : 1;
    const skip = (paginaNum - 1) * limitNum;

    // Ejecutar consulta con paginación
    const [metodos, total] = await Promise.all([
      TarifaMetodo.find(filtros)
        .sort({ prioridad: -1, nombre: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      TarifaMetodo.countDocuments(filtros),
    ]);

    // Calcular metadatos de paginación
    const totalPaginas = Math.ceil(total / limitNum);
    const hayPaginaSiguiente = paginaNum < totalPaginas;
    const hayPaginaAnterior = paginaNum > 1;

    const resultado = {
      metodos,
      paginacion: {
        total,
        pagina: paginaNum,
        limite: limitNum,
        totalPaginas,
        hayPaginaSiguiente,
        hayPaginaAnterior,
      },
      filtros: {
        activo,
        requiereDistancia,
        requierePalets,
        busqueda,
      },
      resumen: {
        totalActivos: await TarifaMetodo.countDocuments({ activo: true }),
        totalInactivos: await TarifaMetodo.countDocuments({ activo: false }),
        conDistancia: await TarifaMetodo.countDocuments({ activo: true, requiereDistancia: true }),
        conPalets: await TarifaMetodo.countDocuments({ activo: true, requierePalets: true }),
      },
    };

    logger.debug(
      `[TarifaMetodo] Consulta realizada: ${metodos.length} resultados de ${total} total`,
      {
        filtros,
        usuario: (req as unknown).user?.email,
      }
    );

    ApiResponse.success(res, resultado, 'Métodos de tarifa obtenidos exitosamente');
  } catch (error: unknown) {
    logger.error('[TarifaMetodo] Error al obtener métodos:', error);
    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};
