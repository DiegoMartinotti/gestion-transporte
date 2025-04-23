"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const express = require('express');
const router = express.Router();
const Tramo = require('../models/Tramo');
const Site = require('../models/Site');
const Cliente = require('../models/Cliente');
const tramoController = require('../controllers/tramoController');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
// Middleware para debugging de solicitudes grandes
router.use('/bulk', (req, res, next) => {
    var _a, _b, _c, _d;
    logger.debug('Recibiendo solicitud bulk import:');
    logger.debug('- Headers:', req.headers);
    logger.debug('- Cliente:', (_a = req.body) === null || _a === void 0 ? void 0 : _a.cliente);
    logger.debug('- Cantidad tramos:', ((_c = (_b = req.body) === null || _b === void 0 ? void 0 : _b.tramos) === null || _c === void 0 ? void 0 : _c.length) || 0);
    if (!req.body || !req.body.tramos) {
        logger.error('⚠️ CUERPO DE LA SOLICITUD VACÍO O INCOMPLETO');
        logger.error('Content-Type:', req.headers['content-type']);
        logger.error('Content-Length:', req.headers['content-length']);
        return res.status(400).json({
            success: false,
            message: 'Datos de solicitud vacíos o inválidos',
            debug: {
                contentType: req.headers['content-type'],
                contentLength: req.headers['content-length'],
                bodyEmpty: !req.body,
                tramosEmpty: !((_d = req.body) === null || _d === void 0 ? void 0 : _d.tramos)
            }
        });
    }
    next();
});
// Middleware para verificar el tipo de tramo
router.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
}));
// IMPORTANTE: Primero las rutas específicas
// Obtener tramos vigentes a una fecha determinada
router.get('/vigentes/:fecha', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fecha = new Date(req.params.fecha);
        if (isNaN(fecha.getTime())) {
            return res.status(400).json({ error: 'La fecha proporcionada no es válida' });
        }
        const tramos = yield Tramo.find({
            vigenciaDesde: { $lte: fecha },
            vigenciaHasta: { $gte: fecha }
        }).populate('origen', 'Site location')
            .populate('destino', 'Site location');
        res.json(tramos);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
// Mejorar la ruta para obtener tramos por cliente
router.get('/cliente/:cliente', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger.info('Buscando tramos para cliente:', req.params.cliente);
        const tramos = yield Tramo.find({ cliente: req.params.cliente })
            .populate('origen', 'Site location')
            .populate('destino', 'Site location');
        logger.info(`Se encontraron ${tramos.length} tramos para el cliente ${req.params.cliente}`);
        // Devolver en formato esperado por el frontend
        res.json({
            success: true,
            data: tramos
        });
    }
    catch (error) {
        logger.error('Error al obtener tramos por cliente:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.toString()
        });
    }
}));
// Obtener un tramo específico
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tramo = yield Tramo.findById(req.params.id)
            .populate('origen')
            .populate('destino');
        if (!tramo) {
            return res.status(404).json({ error: 'Tramo no encontrado' });
        }
        res.json(tramo);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
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
router.post('/bulk', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger.debug('Bulk import - Headers:', {
            contentType: req.headers['content-type'],
            contentLength: req.headers['content-length'],
            authorization: req.headers['authorization'] ? 'Presente' : 'Ausente'
        });
        // Validar formato de la solicitud
        if (!req.body) {
            logger.error('Cuerpo de la solicitud nulo o indefinido');
            return res.status(400).json({
                success: false,
                message: 'El cuerpo de la solicitud está vacío'
            });
        }
        const { cliente, tramos } = req.body;
        logger.debug('Datos recibidos en bulk import:', {
            clientePresente: !!cliente,
            tramosPresente: !!tramos,
            tipoTramos: typeof tramos,
            tramosLength: (tramos === null || tramos === void 0 ? void 0 : tramos.length) || 0
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
        yield tramoController.bulkCreateTramos(req, res);
    }
    catch (error) {
        logger.error('Error no controlado en bulk import:', error);
        res.status(500).json({
            success: false,
            message: 'Error en la importación masiva de tramos',
            error: error.message
        });
    }
}));
// Nueva ruta para diagnóstico de duplicados
router.post('/diagnostico-tipos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
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
        if (origen)
            baseQuery.origen = origen;
        if (destino)
            baseQuery.destino = destino;
        if (metodoCalculo)
            baseQuery.metodoCalculo = metodoCalculo;
        // Buscar todos los tramos que coincidan con los criterios
        const tramos = yield Tramo.find(baseQuery)
            .populate('origen', 'Site')
            .populate('destino', 'Site')
            .lean();
        logger.info(`Encontrados ${tramos.length} tramos para diagnóstico con filtros:`, baseQuery);
        // Analizar los tramos por tipo
        const analisis = {
            totalTramos: tramos.length,
            porTipo: {
                TRMC: tramos.filter(t => t.tipo === 'TRMC').length,
                TRMI: tramos.filter(t => t.tipo === 'TRMI').length,
                otros: tramos.filter(t => !['TRMC', 'TRMI'].includes(t.tipo)).length,
                nulos: tramos.filter(t => !t.tipo).length
            },
            tramosSinTipoNormalizado: tramos.filter(t => t.tipo && t.tipo !== 'TRMC' && t.tipo !== 'TRMI').map(t => {
                var _a, _b;
                return ({
                    _id: t._id,
                    origen: (_a = t.origen) === null || _a === void 0 ? void 0 : _a.Site,
                    destino: (_b = t.destino) === null || _b === void 0 ? void 0 : _b.Site,
                    tipo: t.tipo
                });
            }),
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
                        origen: (_a = tramosRuta[0].origen) === null || _a === void 0 ? void 0 : _a.Site,
                        destino: (_b = tramosRuta[0].destino) === null || _b === void 0 ? void 0 : _b.Site,
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
    }
    catch (error) {
        logger.error('Error en diagnóstico de tipos:', error);
        res.status(500).json({
            success: false,
            message: 'Error realizando el diagnóstico',
            error: error.message
        });
    }
}));
// Nuevo endpoint para corregir tipos de tramos
router.post('/corregir-tipos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
                const tramo = yield Tramo.findById(id);
                if (tramo) {
                    const tipoAnterior = tramo.tipo;
                    tramo.tipo = nuevoTipo;
                    yield tramo.save();
                    resultados.actualizados++;
                    logger.info(`Tramo ${id} actualizado de ${tipoAnterior} a ${nuevoTipo}`);
                }
                else {
                    resultados.errores.push({
                        id,
                        error: 'Tramo no encontrado'
                    });
                }
            }
            catch (error) {
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
    }
    catch (error) {
        logger.error('Error corrigiendo tipos:', error);
        res.status(500).json({
            success: false,
            message: 'Error corrigiendo tipos',
            error: error.message
        });
    }
}));
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
router.post('/updateVigenciaMasiva', auth, tramoController.updateVigenciaMasiva);
// Ruta para calcular tarifa
router.post('/calcular-tarifa', auth, tramoController.calcularTarifa);
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
module.exports = router;
//# sourceMappingURL=tramos.js.map