const express = require('express');
const router = express.Router();
const Tramo = require('../models/Tramo');
const verifyToken = require('../middleware/verifyToken');
const Site = require('../models/Site');
const Cliente = require('../models/Cliente');
const tramoController = require('../controllers/tramoController');
const auth = require('../middleware/auth');

// Middleware para debugging de solicitudes grandes
router.use('/bulk', (req, res, next) => {
    console.log('Recibiendo solicitud bulk import:');
    console.log('- Headers:', req.headers);
    console.log('- Cliente:', req.body?.cliente);
    console.log('- Cantidad tramos:', req.body?.tramos?.length || 0);
    
    if (!req.body || !req.body.tramos) {
        console.error('⚠️ CUERPO DE LA SOLICITUD VACÍO O INCOMPLETO');
        console.error('Content-Type:', req.headers['content-type']);
        console.error('Content-Length:', req.headers['content-length']);
        return res.status(400).json({
            success: false,
            message: 'Datos de solicitud vacíos o inválidos',
            debug: {
                contentType: req.headers['content-type'],
                contentLength: req.headers['content-length'],
                bodyEmpty: !req.body,
                tramosEmpty: !req.body?.tramos
            }
        });
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
            return res.status(400).json({
                success: false,
                message: 'El tipo de tramo debe ser TRMC o TRMI'
            });
        }
    }
    next();
});

// IMPORTANTE: Primero las rutas específicas
// Obtener tramos vigentes a una fecha determinada
router.get('/vigentes/:fecha', verifyToken, async (req, res) => {
  try {
    const fecha = new Date(req.params.fecha);
    
    if (isNaN(fecha.getTime())) {
      return res.status(400).json({ error: 'La fecha proporcionada no es válida' });
    }
    
    const tramos = await Tramo.find({
      vigenciaDesde: { $lte: fecha },
      vigenciaHasta: { $gte: fecha }
    }).populate('origen', 'Site location')
      .populate('destino', 'Site location');
      
    res.json(tramos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mejorar la ruta para obtener tramos por cliente
router.get('/cliente/:cliente', verifyToken, async (req, res) => {
  try {
    console.log('Buscando tramos para cliente:', req.params.cliente);
    
    const tramos = await Tramo.find({ cliente: req.params.cliente })
      .populate('origen', 'Site location')
      .populate('destino', 'Site location');
    
    console.log(`Se encontraron ${tramos.length} tramos para el cliente ${req.params.cliente}`);
    
    // Devolver en formato esperado por el frontend
    res.json({
      success: true,
      data: tramos
    });
  } catch (error) {
    console.error('Error al obtener tramos por cliente:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: error.toString()
    });
  }
});

// Obtener un tramo específico
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const tramo = await Tramo.findById(req.params.id)
      .populate('origen')
      .populate('destino');
    if (!tramo) {
      return res.status(404).json({ error: 'Tramo no encontrado' });
    }
    res.json(tramo);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
router.get('/', auth, tramoController.getAllTramos);

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
router.post('/', auth, tramoController.createTramo);

// Mejorada la ruta bulk para manejar errores mejor
router.post('/bulk', verifyToken, async (req, res) => {
    try {
        console.log('Bulk import - Headers:', {
            contentType: req.headers['content-type'],
            contentLength: req.headers['content-length'],
            authorization: req.headers['authorization'] ? 'Presente' : 'Ausente'
        });

        // Validar formato de la solicitud
        if (!req.body) {
            console.error('Cuerpo de la solicitud nulo o indefinido');
            return res.status(400).json({
                success: false,
                message: 'El cuerpo de la solicitud está vacío'
            });
        }

        const { cliente, tramos } = req.body;
        
        console.log('Datos recibidos en bulk import:', {
            clientePresente: !!cliente,
            tramosPresente: !!tramos,
            tipoTramos: typeof tramos,
            tramosLength: tramos?.length || 0
        });

        if (!cliente) {
            return res.status(400).json({
                success: false,
                message: 'Cliente no especificado'
            });
        }

        if (!tramos || !Array.isArray(tramos)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de tramos inválido',
                debug: {
                    tramosType: typeof tramos,
                    isArray: Array.isArray(tramos)
                }
            });
        }

        // Llamar al controlador para procesar los tramos
        await tramoController.bulkCreateTramos(req, res);
    } catch (error) {
        console.error('Error no controlado en bulk import:', error);
        res.status(500).json({
            success: false,
            message: 'Error en la importación masiva de tramos',
            error: error.message
        });
    }
});

// Nueva ruta para diagnóstico de duplicados
router.post('/diagnostico-tipos', verifyToken, async (req, res) => {
    try {
        const { cliente, origen, destino, metodoCalculo } = req.body;
        
        if (!cliente) {
            return res.status(400).json({
                success: false,
                message: 'Cliente es requerido para el diagnóstico'
            });
        }

        // Construir la consulta base
        const baseQuery = { cliente };
        
        // Añadir filtros opcionales
        if (origen) baseQuery.origen = origen;
        if (destino) baseQuery.destino = destino;
        if (metodoCalculo) baseQuery.metodoCalculo = metodoCalculo;

        // Buscar todos los tramos que coincidan con los criterios
        const tramos = await Tramo.find(baseQuery)
            .populate('origen', 'Site')
            .populate('destino', 'Site')
            .lean();

        console.log(`Encontrados ${tramos.length} tramos para diagnóstico con filtros:`, baseQuery);

        // Analizar los tramos por tipo
        const analisis = {
            totalTramos: tramos.length,
            porTipo: {
                TRMC: tramos.filter(t => t.tipo === 'TRMC').length,
                TRMI: tramos.filter(t => t.tipo === 'TRMI').length,
                otros: tramos.filter(t => !['TRMC', 'TRMI'].includes(t.tipo)).length,
                nulos: tramos.filter(t => !t.tipo).length
            },
            tramosSinTipoNormalizado: tramos.filter(t => t.tipo && t.tipo !== 'TRMC' && t.tipo !== 'TRMI').map(t => ({
                _id: t._id,
                origen: t.origen?.Site,
                destino: t.destino?.Site,
                tipo: t.tipo
            })),
            posiblesConflictos: []
        };

        // Encontrar pares de tramos que podrían estar en conflicto
        // (mismo origen-destino pero diferentes tipos)
        const rutasUnicas = {};
        
        tramos.forEach(tramo => {
            const rutaKey = `${tramo.origen._id}-${tramo.destino._id}-${tramo.metodoCalculo}`;
            if (!rutasUnicas[rutaKey]) {
                rutasUnicas[rutaKey] = [];
            }
            rutasUnicas[rutaKey].push(tramo);
        });

        // Identificar rutas con múltiples tipos
        for (const ruta in rutasUnicas) {
            const tramosRuta = rutasUnicas[ruta];
            if (tramosRuta.length > 1) {
                // Verificar si hay diferentes tipos en esta ruta
                const tiposEnRuta = new Set(tramosRuta.map(t => t.tipo));
                if (tiposEnRuta.size > 1) {
                    analisis.posiblesConflictos.push({
                        ruta: ruta,
                        origen: tramosRuta[0].origen?.Site,
                        destino: tramosRuta[0].destino?.Site,
                        tipos: Array.from(tiposEnRuta),
                        tramos: tramosRuta.map(t => ({
                            _id: t._id,
                            tipo: t.tipo,
                            vigenciaDesde: t.vigenciaDesde,
                            vigenciaHasta: t.vigenciaHasta,
                            valor: t.valor
                        }))
                    });
                }
            }
        }

        res.json({
            success: true,
            analisis
        });
    } catch (error) {
        console.error('Error en diagnóstico de tipos:', error);
        res.status(500).json({
            success: false,
            message: 'Error realizando el diagnóstico',
            error: error.message
        });
    }
});

// Nuevo endpoint para corregir tipos de tramos
router.post('/corregir-tipos', verifyToken, async (req, res) => {
    try {
        const { tramoIds, nuevoTipo } = req.body;
        
        if (!tramoIds || !Array.isArray(tramoIds) || tramoIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren IDs de tramos para corregir'
            });
        }
        
        if (!nuevoTipo || !['TRMC', 'TRMI'].includes(nuevoTipo)) {
            return res.status(400).json({
                success: false,
                message: 'El nuevo tipo debe ser TRMC o TRMI'
            });
        }
        
        const resultados = {
            procesados: tramoIds.length,
            actualizados: 0,
            errores: []
        };
        
        for (const id of tramoIds) {
            try {
                const tramo = await Tramo.findById(id);
                if (tramo) {
                    const tipoAnterior = tramo.tipo;
                    tramo.tipo = nuevoTipo;
                    await tramo.save();
                    resultados.actualizados++;
                    console.log(`Tramo ${id} actualizado de ${tipoAnterior} a ${nuevoTipo}`);
                } else {
                    resultados.errores.push({
                        id,
                        error: 'Tramo no encontrado'
                    });
                }
            } catch (error) {
                resultados.errores.push({
                    id,
                    error: error.message
                });
            }
        }
        
        res.json({
            success: true,
            resultados
        });
    } catch (error) {
        console.error('Error corrigiendo tipos:', error);
        res.status(500).json({
            success: false,
            message: 'Error corrigiendo tipos',
            error: error.message
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
router.put('/:id', auth, tramoController.updateTramo);

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
router.delete('/:id', auth, tramoController.deleteTramo);

// Ruta para verificar posibles duplicados
router.post('/verificarDuplicados', verifyToken, tramoController.verificarPosiblesDuplicados);

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
router.post('/updateVigenciaMasiva', auth, tramoController.updateVigenciaMasiva);

// Ruta para calcular tarifa
router.post('/calcular-tarifa', verifyToken, tramoController.calcularTarifa);

module.exports = router;
