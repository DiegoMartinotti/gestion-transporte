/* eslint-disable max-lines */
import express from 'express';
import type { FilterQuery } from 'mongoose';
import Tramo, { ITramo } from '../models/Tramo';
import * as tramoController from '../controllers/tramo/index';
import { authenticateToken } from '../middleware/authMiddleware';
import logger from '../utils/logger';
import { generarTramoId, Tramo as TramoShape } from '../utils/tramoValidator';

const router = express.Router();

// Constantes para evitar duplicación de strings
const CONTENT_TYPE_HEADER = 'content-type';
const CONTENT_LENGTH_HEADER = 'content-length';
const SITE_POPULATE_FIELDS = 'Site location';

type PopulatedSiteRef =
  | string
  | { _id?: string | { toString(): string }; Site?: string; nombre?: string };

interface DiagnosticoTramo {
  _id: string;
  origen: PopulatedSiteRef;
  destino: PopulatedSiteRef;
  tipo?: string;
  metodoCalculo?: string;
  vigenciaDesde?: Date;
  vigenciaHasta?: Date;
  valor?: number;
}

interface DiagnosticoConflicto {
  ruta: string;
  origen?: string;
  destino?: string;
  tipos: string[];
  tramos: Array<{
    _id: string;
    tipo?: string;
    vigenciaDesde?: Date;
    vigenciaHasta?: Date;
    valor?: number;
  }>;
}

interface AnalisisDiagnostico {
  totalTramos: number;
  porTipo: {
    TRMC: number;
    TRMI: number;
    otros: number;
    nulos: number;
  };
  tramosSinTipoNormalizado: Array<{
    _id: string;
    origen?: string;
    destino?: string;
    tipo?: string;
  }>;
  posiblesConflictos: DiagnosticoConflicto[];
}

const getSiteLabel = (site: PopulatedSiteRef): string | undefined => {
  if (!site) {
    return undefined;
  }
  if (typeof site === 'string') {
    return site;
  }
  if (typeof site === 'object') {
    if (site.nombre) {
      return String(site.nombre);
    }
    if (site.Site) {
      return String(site.Site);
    }
    if (site._id) {
      return typeof site._id === 'string' ? site._id : site._id.toString();
    }
  }
  return undefined;
};

const getRefId = (ref: PopulatedSiteRef): string => {
  if (!ref) {
    return 'desconocido';
  }
  if (typeof ref === 'string') {
    return ref;
  }
  if (typeof ref === 'object' && ref._id) {
    return typeof ref._id === 'string' ? ref._id : ref._id.toString();
  }
  return 'desconocido';
};

const buildDiagnosticoPorTipo = (tramos: ITramo[]) => {
  const detallesPorTipo: Record<string, Array<Record<string, unknown>>> = {};

  tramos.forEach((tramo) => {
    const tarifaVigente = tramo.getTarifaVigente();
    const tipo = tarifaVigente?.tipo || 'Sin tipo';

    if (!detallesPorTipo[tipo]) {
      detallesPorTipo[tipo] = [];
    }

    const shape: TramoShape = {
      origen: String(tramo.origen),
      destino: String(tramo.destino),
      tipo: tarifaVigente?.tipo,
      metodoCalculo: tarifaVigente?.metodoCalculo,
    };

    detallesPorTipo[tipo].push({
      _id: String(tramo._id),
      tipo: tarifaVigente?.tipo,
      vigenciaDesde: tarifaVigente?.vigenciaDesde,
      vigenciaHasta: tarifaVigente?.vigenciaHasta,
      metodoCalculo: tarifaVigente?.metodoCalculo,
      generatedId: generarTramoId(shape),
    });
  });

  const tiposEncontrados = Object.keys(detallesPorTipo).length;
  const diagnosis =
    tramos.length > 0 && tiposEncontrados > 1
      ? 'OK: El sistema permite tramos con diferentes tipos'
      : 'Problema: No hay tramos con diferentes tipos para este origen-destino';

  return {
    mensaje: `Análisis completado: ${tramos.length} tramos para el mismo origen-destino`,
    totalTramos: tramos.length,
    tiposEncontrados,
    detallesPorTipo,
    diagnosis,
  };
};

// Middleware para debugging de solicitudes grandes
router.use('/bulk', (req, res, next) => {
  logger.debug('Recibiendo solicitud bulk import:');
  logger.debug('- Headers:', req.headers);
  logger.debug('- Cliente:', req.body?.cliente);
  logger.debug('- Cantidad tramos:', req.body?.tramos?.length || 0);

  if (!req.body || !req.body.tramos) {
    logger.error('⚠️ CUERPO DE LA SOLICITUD VACÍO O INCOMPLETO');
    logger.error('Content-Type:', req.headers[CONTENT_TYPE_HEADER]);
    logger.error('Content-Length:', req.headers[CONTENT_LENGTH_HEADER]);
    res.status(400).json({
      success: false,
      message: 'Datos de solicitud vacíos o inválidos',
      debug: {
        contentType: req.headers[CONTENT_TYPE_HEADER],
        contentLength: req.headers[CONTENT_LENGTH_HEADER],
        bodyEmpty: !req.body,
        tramosEmpty: !req.body?.tramos,
      },
    });
    return;
  }

  next();
});

// Middleware para verificar el tipo de tramo
router.use(async (req, res, next) => {
  if (['POST', 'PUT'].includes(req.method) && req.body.tipo) {
    // Normalizar el tipo a mayúsculas
    req.body.tipo = req.body.tipo.toUpperCase();

    // Verificar que es un tipo válido
    if (!['TRMC', 'TRMI'].includes(req.body.tipo)) {
      res.status(400).json({
        success: false,
        message: 'El tipo de tramo debe ser TRMC o TRMI',
      });
      return;
    }
  }
  next();
});

// IMPORTANTE: Primero las rutas específicas
// Obtener tramos vigentes a una fecha determinada
router.get('/vigentes/:fecha', async (req, res) => {
  try {
    const fecha = new Date(req.params.fecha);

    if (isNaN(fecha.getTime())) {
      res.status(400).json({ error: 'La fecha proporcionada no es válida' });
      return;
    }

    const tramos = await Tramo.find({
      vigenciaDesde: { $lte: fecha },
      vigenciaHasta: { $gte: fecha },
    })
      .populate('origen', SITE_POPULATE_FIELDS)
      .populate('destino', SITE_POPULATE_FIELDS);

    res.json(tramos);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Mejorar la ruta para obtener tramos por cliente
router.get('/cliente/:cliente', async (req, res) => {
  try {
    logger.info('Buscando tramos para cliente:', req.params.cliente);

    const tramos = await Tramo.find({ cliente: req.params.cliente })
      .populate('origen', SITE_POPULATE_FIELDS)
      .populate('destino', SITE_POPULATE_FIELDS);

    logger.info(`Se encontraron ${tramos.length} tramos para el cliente ${req.params.cliente}`);

    // Devolver en formato esperado por el frontend
    res.json({
      success: true,
      data: tramos,
    });
  } catch (error) {
    logger.error('Error al obtener tramos por cliente:', error);
    res.status(500).json({
      success: false,
      message: (error as Error).message,
      error: (error as Error).toString(),
    });
  }
});

// Obtener un tramo específico
router.get('/:id', async (req, res) => {
  try {
    const tramo = await Tramo.findById(req.params.id).populate('origen').populate('destino');
    if (!tramo) {
      res.status(404).json({ error: 'Tramo no encontrado' });
      return;
    }
    res.json(tramo);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Después las rutas genéricas
/**
 * @swagger
 * /api/tramos:
 *   get:
 *     tags:
 *       - Tramos
 *     summary: Lista todos los tramos
 *     description: Obtiene una lista paginada de tramos con opción de filtrado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Elementos por página
 *       - in: query
 *         name: cliente
 *         schema:
 *           type: string
 *         description: ID del cliente para filtrar
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [TRMC, TMRI]
 *         description: Tipo de tramo
 *     responses:
 *       200:
 *         description: Lista de tramos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tramo'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authenticateToken, tramoController.getAllTramos);
router.get('/template', tramoController.getTramoTemplate);

// Crear nuevo tramo
/**
 * @swagger
 * /api/tramos:
 *   post:
 *     tags:
 *       - Tramos
 *     summary: Crea un nuevo tramo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origen
 *               - destino
 *               - tipo
 *               - cliente
 *               - vigenciaDesde
 *               - vigenciaHasta
 *               - metodoCalculo
 *             properties:
 *               origen:
 *                 type: string
 *                 description: ID del sitio de origen
 *               destino:
 *                 type: string
 *                 description: ID del sitio de destino
 *               tipo:
 *                 type: string
 *                 enum: [TRMC, TMRI]
 *               cliente:
 *                 type: string
 *                 description: ID del cliente
 *               vigenciaDesde:
 *                 type: string
 *                 format: date-time
 *               vigenciaHasta:
 *                 type: string
 *                 format: date-time
 *               metodoCalculo:
 *                 type: string
 *                 enum: [Palet, Kilometro, Fijo]
 *               valorPeaje:
 *                 type: number
 *     responses:
 *       201:
 *         description: Tramo creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tramo'
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Conflicto con tramos existentes
 */
router.post('/', authenticateToken, tramoController.createTramo);

// Mejorada la ruta bulk para manejar errores mejor
router.post('/bulk', async (req: express.Request, res: express.Response) => {
  try {
    logger.debug('Bulk import - Headers:', {
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      authorization: req.headers['authorization'] ? 'Presente' : 'Ausente',
    });

    // Validar formato de la solicitud
    if (!req.body) {
      logger.error('Cuerpo de la solicitud nulo o indefinido');
      res.status(400).json({
        success: false,
        message: 'El cuerpo de la solicitud está vacío',
      });
      return;
    }

    const { cliente, tramos } = req.body;

    logger.debug('Datos recibidos en bulk import:', {
      clientePresente: !!cliente,
      tramosPresente: !!tramos,
      tipoTramos: typeof tramos,
      tramosLength: tramos?.length || 0,
    });

    if (!cliente) {
      res.status(400).json({
        success: false,
        message: 'Cliente no especificado',
      });
      return;
    }

    if (!tramos || !Array.isArray(tramos)) {
      res.status(400).json({
        success: false,
        message: 'Formato de tramos inválido',
        debug: {
          tramosType: typeof tramos,
          isArray: Array.isArray(tramos),
        },
      });
      return;
    }

    // Llamar al controlador para procesar los tramos
    await tramoController.bulkCreateTramos(req, res);
  } catch (error) {
    logger.error('Error no controlado en bulk import:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la importación masiva de tramos',
      error: (error as Error).message,
    });
  }
});

// Nueva ruta para diagnóstico de duplicados
// eslint-disable-next-line max-lines-per-function
router.post('/diagnostico-tipos', async (req, res) => {
  try {
    const { cliente, origen, destino, metodoCalculo } = req.body;

    if (!cliente) {
      res.status(400).json({
        success: false,
        message: 'Cliente es requerido para el diagnóstico',
      });
    }

    // Construir la consulta base
    const baseQuery: FilterQuery<ITramo> = { cliente };

    // Añadir filtros opcionales
    if (origen) baseQuery.origen = origen;
    if (destino) baseQuery.destino = destino;
    if (metodoCalculo) baseQuery.metodoCalculo = metodoCalculo;

    // Buscar todos los tramos que coincidan con los criterios
    const tramos =
      (await Tramo.find(baseQuery)
        .populate('origen', 'Site')
        .populate('destino', 'Site')
        .lean<DiagnosticoTramo[]>()
        .exec()) ?? [];

    logger.info(`Encontrados ${tramos.length} tramos para diagnóstico con filtros:`, baseQuery);

    // Analizar los tramos por tipo
    const analisis: AnalisisDiagnostico = {
      totalTramos: tramos.length,
      porTipo: {
        TRMC: tramos.filter((t) => t.tipo === 'TRMC').length,
        TRMI: tramos.filter((t) => t.tipo === 'TRMI').length,
        otros: tramos.filter((t) => t.tipo && !['TRMC', 'TRMI'].includes(t.tipo)).length,
        nulos: tramos.filter((t) => !t.tipo).length,
      },
      tramosSinTipoNormalizado: tramos
        .filter((t) => t.tipo && t.tipo !== 'TRMC' && t.tipo !== 'TRMI')
        .map((t) => ({
          _id: t._id,
          origen: getSiteLabel(t.origen),
          destino: getSiteLabel(t.destino),
          tipo: t.tipo,
        })),
      posiblesConflictos: [],
    };

    // Encontrar pares de tramos que podrían estar en conflicto
    // (mismo origen-destino pero diferentes tipos)
    const rutasUnicas: Record<string, DiagnosticoTramo[]> = {};

    tramos.forEach((tramo) => {
      const rutaKey = `${getRefId(tramo.origen)}-${getRefId(tramo.destino)}-${tramo.metodoCalculo ?? 'SIN_METODO'}`;
      if (!rutasUnicas[rutaKey]) {
        rutasUnicas[rutaKey] = [];
      }
      rutasUnicas[rutaKey].push(tramo);
    });

    // Identificar rutas con múltiples tipos
    for (const ruta of Object.keys(rutasUnicas)) {
      const tramosRuta = rutasUnicas[ruta];
      if (tramosRuta.length > 1) {
        // Verificar si hay diferentes tipos en esta ruta
        const tiposEnRuta = new Set(tramosRuta.map((t) => t.tipo ?? 'SIN_TIPO'));
        if (tiposEnRuta.size > 1) {
          analisis.posiblesConflictos.push({
            ruta: ruta,
            origen: getSiteLabel(tramosRuta[0].origen),
            destino: getSiteLabel(tramosRuta[0].destino),
            tipos: Array.from(tiposEnRuta),
            tramos: tramosRuta.map((t) => ({
              _id: t._id,
              tipo: t.tipo,
              vigenciaDesde: t.vigenciaDesde,
              vigenciaHasta: t.vigenciaHasta,
              valor: t.valor,
            })),
          });
        }
      }
    }

    res.json({
      success: true,
      analisis,
    });
  } catch (error) {
    logger.error('Error en diagnóstico de tipos:', error);
    res.status(500).json({
      success: false,
      message: 'Error realizando el diagnóstico',
      error: (error as Error).message,
    });
  }
});

// Nuevo endpoint para corregir tipos de tramos
// eslint-disable-next-line max-lines-per-function
router.post('/corregir-tipos', async (req, res) => {
  try {
    const { tramoIds, nuevoTipo } = req.body;

    if (!tramoIds || !Array.isArray(tramoIds) || tramoIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Se requieren IDs de tramos para corregir',
      });
    }

    if (!nuevoTipo || !['TRMC', 'TRMI'].includes(nuevoTipo)) {
      res.status(400).json({
        success: false,
        message: 'El nuevo tipo debe ser TRMC o TRMI',
      });
    }

    const resultados: {
      procesados: number;
      actualizados: number;
      errores: Array<{ id: string; error: string }>;
    } = {
      procesados: tramoIds.length,
      actualizados: 0,
      errores: [],
    };

    for (const id of tramoIds) {
      try {
        const tramo = await Tramo.findById(id);
        if (tramo) {
          const tipoAnterior = tramo.get('tipo') as string | undefined;
          tramo.set('tipo', nuevoTipo);
          await tramo.save();
          resultados.actualizados++;
          logger.info(`Tramo ${id} actualizado de ${tipoAnterior} a ${nuevoTipo}`);
        } else {
          resultados.errores.push({
            id,
            error: 'Tramo no encontrado',
          });
        }
      } catch (error) {
        resultados.errores.push({
          id,
          error: (error as Error).message,
        });
      }
    }

    res.json({
      success: true,
      resultados,
    });
  } catch (error) {
    logger.error('Error corrigiendo tipos:', error);
    res.status(500).json({
      success: false,
      message: 'Error corrigiendo tipos',
      error: (error as Error).message,
    });
  }
});

// Actualizar tramo
/**
 * @swagger
 * /api/tramos/{id}:
 *   put:
 *     tags:
 *       - Tramos
 *     summary: Actualiza un tramo existente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tramo'
 *     responses:
 *       200:
 *         description: Tramo actualizado
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Conflicto con otros tramos
 */
router.put('/:id', authenticateToken, tramoController.updateTramo);

// Eliminar tramo
/**
 * @swagger
 * /api/tramos/{id}:
 *   delete:
 *     tags:
 *       - Tramos
 *     summary: Elimina un tramo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tramo eliminado exitosamente
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', authenticateToken, tramoController.deleteTramo);

// Ruta para verificar posibles duplicados
router.post('/verificarDuplicados', tramoController.verificarPosiblesDuplicados);

// Ruta para actualización masiva de vigencias
/**
 * @swagger
 * /api/tramos/updateVigenciaMasiva:
 *   post:
 *     tags:
 *       - Tramos
 *     summary: Actualiza la vigencia de múltiples tramos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tramosIds
 *               - vigenciaDesde
 *               - vigenciaHasta
 *             properties:
 *               tramosIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de IDs de tramos a actualizar
 *               vigenciaDesde:
 *                 type: string
 *                 format: date-time
 *               vigenciaHasta:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Resultado de la actualización masiva
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 actualizados:
 *                   type: array
 *                   items:
 *                     type: string
 *                 conflictos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tramoId:
 *                         type: string
 *                       mensaje:
 *                         type: string
 */
router.post('/updateVigenciaMasiva', authenticateToken, tramoController.updateVigenciaMasiva);

// Ruta para calcular tarifa
router.post('/calcular-tarifa', authenticateToken, tramoController.calcularTarifa);

/**
 * @swagger
 * /api/tramos/distancias:
 *   get:
 *     tags:
 *       - Tramos
 *     summary: Obtiene las distancias calculadas para pares origen-destino
 *     responses:
 *       200:
 *         description: Lista de distancias calculadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       origen:
 *                         type: string
 *                       destino:
 *                         type: string
 *                       distancia:
 *                         type: number
 */
router.get('/distancias', tramoController.getDistanciasCalculadas);

// Función de diagnóstico específica para problemas de tipos (migrada desde tramoRoutes.ts)
router.post('/diagnose-tipos', async (req, res): Promise<void> => {
  try {
    const { origen, destino, cliente } = req.body;

    if (!origen || !destino || !cliente) {
      res.status(400).json({
        success: false,
        message: 'Se requieren origen, destino y cliente',
      });
      return;
    }

    const tramos = await Tramo.find({ origen, destino, cliente }).exec();
    const diagnostico = buildDiagnosticoPorTipo(tramos);

    res.json({
      success: true,
      ...diagnostico,
    });
  } catch (error: unknown) {
    logger.error('Error en diagnóstico:', error);
    res.status(500).json({
      success: false,
      message: 'Error en diagnóstico',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
