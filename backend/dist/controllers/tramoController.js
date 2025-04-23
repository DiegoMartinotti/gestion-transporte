"use strict";
/**
 * @module controllers/tramoController
 * @description Controlador para gestionar los tramos de transporte
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const Tramo = require('../models/Tramo');
const Cliente = require('../models/Cliente'); // Importamos el modelo Cliente
const Site = require('../models/Site');
const { format } = require('date-fns');
const { fechasSuperpuestas, generarTramoId, sonTramosIguales } = require('../utils/tramoValidator');
const { calcularTarifaPaletConFormula } = require('../utils/formulaParser'); // Importamos el parser de fórmulas
const { calcularDistanciaRuta } = require('../services/routingService'); // Importamos el servicio de cálculo de distancias
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const tarifaService = require('../services/tarifaService'); // Importamos el servicio de tarifas
const formulaClienteService = require('../services/formulaClienteService'); // Importar el servicio de fórmulas personalizadas
const tramoService = require('../services/tramo/tramoService'); // Importar el servicio de tramos
const Extra = require('../models/Extra');
const path = require('path');
const fs = require('fs');
const util = require('util');
const streamPipeline = util.promisify(require('stream').pipeline);
const axios = require('axios');
/**
 * Obtiene todos los tramos asociados a un cliente específico
 *
 * @async
 * @function getTramosByCliente
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.cliente - ID del cliente
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Lista de tramos del cliente
 * @throws {Error} Error 500 si hay un error en el servidor
 */
exports.getTramosByCliente = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        logger.debug('Buscando tramos para cliente:', req.params.cliente);
        const { cliente } = req.params;
        const { desde, hasta, incluirHistoricos } = req.query;
        // Parámetros de paginación
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20; // Límite por defecto
        const skip = (page - 1) * limit;
        logger.debug(`Parámetros de filtro: desde=${desde}, hasta=${hasta}, incluirHistoricos=${incluirHistoricos}, page=${page}, limit=${limit}`);
        // Construir el pipeline de agregación
        const pipeline = [];
        // Etapa 1: Filtrado inicial por cliente
        // Seleccionamos solo los tramos que pertenecen al cliente solicitado
        pipeline.push({ $match: { cliente: mongoose.Types.ObjectId(cliente) } });
        // Etapa 1.5: Lookup para enriquecer datos del cliente
        // Unimos con la colección 'clientes' para obtener los detalles del cliente
        pipeline.push({
            $lookup: {
                from: 'clientes', // Nombre de la colección de clientes
                localField: 'cliente',
                foreignField: '_id',
                as: 'clienteData'
            }
        }, 
        // Desempaquetar el array resultante y reemplazar el campo 'cliente'
        {
            $addFields: {
                // Reemplaza el ObjectId de cliente con el primer (y único) documento encontrado
                cliente: { $arrayElemAt: ['$clienteData', 0] }
            }
        }, 
        // Opcional: Eliminar el campo temporal si no se necesita más adelante
        {
            $project: {
                clienteData: 0
            }
        });
        // Etapa 2: Lookup para enriquecer datos de origen y destino
        // Realizamos una operación de join con la colección de sites para obtener
        // la información completa de los sitios de origen y destino
        pipeline.push({
            $lookup: {
                from: 'sites',
                localField: 'origen',
                foreignField: '_id',
                as: 'origenData'
            }
        }, {
            $lookup: {
                from: 'sites',
                localField: 'destino',
                foreignField: '_id',
                as: 'destinoData'
            }
        }, 
        // Desempaquetar los arrays resultantes del lookup
        // Convertimos los arrays de un solo elemento a objetos directos
        {
            $addFields: {
                origen: { $arrayElemAt: ['$origenData', 0] },
                destino: { $arrayElemAt: ['$destinoData', 0] }
            }
        }, 
        // Eliminamos los campos temporales que ya no necesitamos
        {
            $project: {
                origenData: 0,
                destinoData: 0
            }
        });
        // Si se solicitan tramos históricos con filtro de fecha
        if (desde && hasta && incluirHistoricos === 'true') {
            logger.debug('Procesando tramos históricos con filtro de fecha');
            // Convertir fechas a objetos Date para comparación
            const desdeDate = new Date(desde);
            const hastaDate = new Date(hasta);
            logger.debug(`Filtrando tramos por rango de fechas: ${desdeDate.toISOString().split('T')[0]} - ${hastaDate.toISOString().split('T')[0]}`);
            // Etapa 3a: Procesamiento de tramos históricos con facet
            // Usamos $facet para procesar en paralelo dos tipos de tramos:
            // 1. Tramos con tarifasHistoricas (modelo nuevo)
            // 2. Tramos sin tarifasHistoricas (modelo antiguo)
            pipeline.push({
                $facet: {
                    // Procesamiento de tramos con tarifasHistoricas (modelo nuevo)
                    tramosConHistorico: [
                        // Seleccionamos solo tramos que tienen tarifas históricas
                        { $match: { tarifasHistoricas: { $exists: true, $ne: [] } } },
                        // Desplegar el array tarifasHistoricas para procesar cada tarifa independientemente
                        { $unwind: '$tarifasHistoricas' },
                        // Filtrado por fechas de vigencia: solo tarifas que se superponen con el rango solicitado
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $lte: [{ $toDate: '$tarifasHistoricas.vigenciaDesde' }, hastaDate] },
                                        { $gte: [{ $toDate: '$tarifasHistoricas.vigenciaHasta' }, desdeDate] }
                                    ]
                                }
                            }
                        },
                        // Transferimos propiedades de la tarifa histórica al documento principal
                        // para facilitar el procesamiento posterior
                        {
                            $addFields: {
                                tipo: '$tarifasHistoricas.tipo',
                                metodoCalculo: '$tarifasHistoricas.metodoCalculo',
                                valor: '$tarifasHistoricas.valor',
                                valorPeaje: '$tarifasHistoricas.valorPeaje',
                                vigenciaDesde: '$tarifasHistoricas.vigenciaDesde',
                                vigenciaHasta: '$tarifasHistoricas.vigenciaHasta'
                            }
                        },
                        // Ordenamos para asegurar que obtenemos la tarifa más reciente primero
                        {
                            $sort: { 'tarifasHistoricas.vigenciaHasta': -1 }
                        },
                        // Agrupamos por origen-destino-tipo para obtener un solo tramo por cada combinación
                        // (el primero será el más reciente debido al ordenamiento previo)
                        {
                            $group: {
                                _id: {
                                    origenSite: '$origen.Site',
                                    destinoSite: '$destino.Site',
                                    tipo: { $ifNull: ['$tarifasHistoricas.tipo', 'TRMC'] }
                                },
                                tramo: { $first: '$$ROOT' }
                            }
                        },
                        // Reemplazamos el documento raíz con el tramo completo
                        {
                            $replaceRoot: { newRoot: '$tramo' }
                        }
                    ],
                    // Procesamiento de tramos con formato antiguo (sin tarifasHistoricas)
                    tramosAntiguos: [
                        // Seleccionamos tramos sin tarifas históricas pero con campos de vigencia
                        {
                            $match: {
                                $or: [
                                    { tarifasHistoricas: { $exists: false } },
                                    { tarifasHistoricas: { $size: 0 } }
                                ],
                                vigenciaDesde: { $exists: true },
                                vigenciaHasta: { $exists: true }
                            }
                        },
                        // Filtrado por fechas de vigencia: solo tramos que se superponen con el rango solicitado
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $lte: [{ $toDate: '$vigenciaDesde' }, hastaDate] },
                                        { $gte: [{ $toDate: '$vigenciaHasta' }, desdeDate] }
                                    ]
                                }
                            }
                        },
                        // Ordenamos para asegurar que obtenemos el tramo más reciente primero
                        {
                            $sort: { vigenciaHasta: -1 }
                        },
                        // Agrupamos por origen-destino-tipo para obtener un solo tramo por cada combinación
                        {
                            $group: {
                                _id: {
                                    origenSite: '$origen.Site',
                                    destinoSite: '$destino.Site',
                                    tipo: { $ifNull: ['$tipo', 'TRMC'] }
                                },
                                tramo: { $first: '$$ROOT' }
                            }
                        },
                        // Reemplazamos el documento raíz con el tramo completo
                        {
                            $replaceRoot: { newRoot: '$tramo' }
                        }
                    ]
                }
            }, 
            // Combinamos los resultados de ambos facets en un solo array
            {
                $project: {
                    combinedResults: { $concatArrays: ['$tramosConHistorico', '$tramosAntiguos'] }
                }
            }, 
            // Desenrollamos el array de resultados combinados
            { $unwind: '$combinedResults' }, 
            // Reemplazamos el documento raíz con cada resultado
            { $replaceRoot: { newRoot: '$combinedResults' } });
        }
        else {
            // Etapa 3b: Procesamiento normal (sin filtro de fechas históricas)
            // Similar al procesamiento histórico pero sin filtrar por fechas de vigencia
            pipeline.push({
                $facet: {
                    // Procesamiento de tramos con tarifasHistoricas
                    tramosConHistorico: [
                        { $match: { tarifasHistoricas: { $exists: true, $ne: [] } } },
                        // Desplegar el array tarifasHistoricas
                        { $unwind: '$tarifasHistoricas' },
                        // Transferir propiedades de la tarifa al tramo principal
                        {
                            $addFields: {
                                tipo: '$tarifasHistoricas.tipo',
                                metodoCalculo: '$tarifasHistoricas.metodoCalculo',
                                valor: '$tarifasHistoricas.valor',
                                valorPeaje: '$tarifasHistoricas.valorPeaje',
                                vigenciaDesde: '$tarifasHistoricas.vigenciaDesde',
                                vigenciaHasta: '$tarifasHistoricas.vigenciaHasta'
                            }
                        },
                        // Agrupar por origen, destino y tipo para obtener solo el más reciente
                        {
                            $sort: { 'tarifasHistoricas.vigenciaHasta': -1 }
                        },
                        {
                            $group: {
                                _id: {
                                    origenSite: '$origen.Site',
                                    destinoSite: '$destino.Site',
                                    tipo: { $ifNull: ['$tarifasHistoricas.tipo', 'TRMC'] }
                                },
                                tramo: { $first: '$$ROOT' }
                            }
                        },
                        {
                            $replaceRoot: { newRoot: '$tramo' }
                        }
                    ],
                    // Procesar tramos con formato antiguo
                    tramosAntiguos: [
                        {
                            $match: {
                                $or: [
                                    { tarifasHistoricas: { $exists: false } },
                                    { tarifasHistoricas: { $size: 0 } }
                                ],
                                tipo: { $exists: true }
                            }
                        },
                        // Agrupar por origen, destino y tipo para obtener solo el más reciente
                        {
                            $sort: { vigenciaHasta: -1 }
                        },
                        {
                            $group: {
                                _id: {
                                    origenSite: '$origen.Site',
                                    destinoSite: '$destino.Site',
                                    tipo: { $ifNull: ['$tipo', 'TRMC'] }
                                },
                                tramo: { $first: '$$ROOT' }
                            }
                        },
                        {
                            $replaceRoot: { newRoot: '$tramo' }
                        }
                    ]
                }
            }, 
            // Unir los resultados de ambos facets
            {
                $project: {
                    combinedResults: { $concatArrays: ['$tramosConHistorico', '$tramosAntiguos'] }
                }
            }, { $unwind: '$combinedResults' }, { $replaceRoot: { newRoot: '$combinedResults' } });
        }
        // Etapa 4: Ordenamiento final de los resultados
        // Organizamos los tramos por origen, destino y tipo para una visualización consistente
        pipeline.push({
            $sort: {
                'origen.Site': 1,
                'destino.Site': 1,
                tipo: 1
            }
        });
        // Etapa 5: Paginación y metadatos
        // Calculamos el total de documentos y aplicamos skip/limit para paginación
        pipeline.push({
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [{ $skip: skip }, { $limit: limit }]
            }
        });
        // Ejecutar la agregación
        const [result] = yield Tramo.aggregate(pipeline);
        // Extraer los datos y metadata
        const totalTramos = ((_a = result.metadata[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        const tramos = result.data;
        logger.debug(`Encontrados ${totalTramos} tramos totales para cliente ${cliente}`);
        logger.debug(`Enviando ${tramos.length} tramos (página ${page})`);
        // Enviar respuesta
        res.json({
            success: true,
            data: tramos,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalTramos / limit),
                totalItems: totalTramos,
                limit: limit
            }
        });
    }
    catch (error) {
        logger.error('Error al obtener tramos por cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tramos',
            error: error.message
        });
    }
});
exports.getDistanciasCalculadas = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Obtener todas las distancias calculadas de tramos existentes
        const distancias = yield Tramo.aggregate([
            // Filtrar solo tramos con distancia calculada
            { $match: { distancia: { $gt: 0 } } },
            // Agrupar por origen-destino y tomar la distancia más reciente
            {
                $group: {
                    _id: { origen: "$origen", destino: "$destino" },
                    distancia: { $first: "$distancia" },
                    updatedAt: { $max: "$updatedAt" }
                }
            },
            // Formatear la salida
            {
                $project: {
                    _id: 0,
                    origen: { $toString: "$_id.origen" },
                    destino: { $toString: "$_id.destino" },
                    distancia: 1
                }
            }
        ]);
        logger.debug(`Se encontraron ${distancias.length} distancias pre-calculadas`);
        res.json({
            success: true,
            data: distancias
        });
    }
    catch (error) {
        logger.error('Error al obtener distancias calculadas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener distancias calculadas',
            error: error.message
        });
    }
});
/**
 * Crea múltiples tramos en una sola operación
 *
 * @async
 * @function bulkCreateTramos
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.body - Cuerpo de la solicitud
 * @param {string} req.body.cliente - ID del cliente
 * @param {Array<Object>} req.body.tramos - Array de objetos con datos de tramos
 * @param {string} req.body.tramos[].origen - ID del sitio de origen
 * @param {string} req.body.tramos[].destino - ID del sitio de destino
 * @param {Object} req.body.tramos[].tarifaHistorica - Datos de la tarifa histórica
 * @param {string} req.body.tramos[].tarifaHistorica.tipo - Tipo de tramo (TRMC/TRMI)
 * @param {string} req.body.tramos[].tarifaHistorica.metodoCalculo - Método de cálculo de tarifa
 * @param {number} req.body.tramos[].tarifaHistorica.valor - Valor base del tramo
 * @param {number} req.body.tramos[].tarifaHistorica.valorPeaje - Valor del peaje
 * @param {Date} req.body.tramos[].tarifaHistorica.vigenciaDesde - Fecha de inicio de vigencia
 * @param {Date} req.body.tramos[].tarifaHistorica.vigenciaHasta - Fecha de fin de vigencia
 * @param {number} req.body.tramos[].distanciaPreCalculada - Distancia pre-calculada (opcional)
 * @param {boolean} req.body.reutilizarDistancias - Indica si se deben reutilizar distancias pre-calculadas
 * @param {boolean} req.body.actualizarExistentes - Indica si se deben actualizar tramos existentes
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Resultado de la operación con tramos creados y errores
 * @throws {Error} Error 400 si los datos son inválidos
 * @throws {Error} Error 500 si hay un error en el servidor
 */
exports.bulkCreateTramos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cliente, tramos, reutilizarDistancias = true, actualizarExistentes = false } = req.body;
        if (!cliente || !tramos || !Array.isArray(tramos)) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere cliente y un array de tramos'
            });
        }
        logger.debug(`Procesando ${tramos.length} tramos para cliente ${cliente}`);
        logger.debug(`Opciones: reutilizarDistancias=${reutilizarDistancias}, actualizarExistentes=${actualizarExistentes}`);
        // Dividir en lotes para evitar problemas de tamaño en la petición
        const BATCH_SIZE = 50;
        const batches = [];
        for (let i = 0; i < tramos.length; i += BATCH_SIZE) {
            batches.push(tramos.slice(i, i + BATCH_SIZE));
        }
        logger.debug(`Dividiendo ${tramos.length} tramos en ${batches.length} lotes de máximo ${BATCH_SIZE} tramos`);
        // Resultados consolidados
        const resultadosConsolidados = {
            total: tramos.length,
            exitosos: 0,
            errores: [],
            tramosCreados: 0,
            tramosActualizados: 0
        };
        // Procesar cada lote
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            try {
                logger.debug(`Procesando lote ${i + 1} de ${batches.length} (${batch.length} tramos)`);
                // Llamar al servicio para procesar el lote
                const resultados = yield tramoService.bulkImportTramos(cliente, batch, reutilizarDistancias, actualizarExistentes);
                // Consolidar resultados
                resultadosConsolidados.exitosos += resultados.exitosos;
                resultadosConsolidados.tramosCreados += resultados.tramosCreados;
                resultadosConsolidados.tramosActualizados += resultados.tramosActualizados;
                // Añadir referencia del lote a cada error
                const erroresConLote = resultados.errores.map(error => (Object.assign(Object.assign({}, error), { lote: i + 1 })));
                resultadosConsolidados.errores.push(...erroresConLote);
                logger.debug(`Lote ${i + 1} procesado: ${resultados.exitosos} exitosos, ${resultados.errores.length} errores`);
            }
            catch (error) {
                logger.error(`Error procesando lote ${i + 1}:`, error);
                // Añadir error del lote completo a los resultados
                resultadosConsolidados.errores.push({
                    lote: i + 1,
                    error: `Error procesando lote: ${error.message}`
                });
            }
        }
        // Enviar respuesta final consolidada
        logger.info(`Importación masiva completada para cliente ${cliente}: ${resultadosConsolidados.exitosos} exitosos, ${resultadosConsolidados.errores.length} errores.`);
        res.status(200).json(Object.assign({ success: true, message: `Proceso completado: ${resultadosConsolidados.exitosos} exitosos, ${resultadosConsolidados.errores.length} errores.` }, resultadosConsolidados));
    }
    catch (error) { // Captura errores generales del controlador
        logger.error('Error general en bulkCreateTramos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor durante la importación masiva',
            error: error.message // Enviar mensaje de error para depuración
        });
    }
});
exports.getVigentesByFecha = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fecha } = req.params;
        const fechaBusqueda = new Date(fecha);
        if (isNaN(fechaBusqueda.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Formato de fecha inválido'
            });
        }
        const tramos = yield Tramo.find({
            vigenciaDesde: { $lte: fechaBusqueda },
            vigenciaHasta: { $gte: fechaBusqueda }
        })
            .populate('origen', 'Site')
            .populate('destino', 'Site');
        res.json({
            success: true,
            data: tramos
        });
    }
    catch (error) {
        logger.error('Error al obtener tramos vigentes:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
exports.getTramoById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const tramo = yield Tramo.findById(id)
            .populate('origen', 'Site location')
            .populate('destino', 'Site location');
        if (!tramo) {
            return res.status(404).json({
                success: false,
                message: 'Tramo no encontrado'
            });
        }
        res.json({
            success: true,
            data: tramo
        });
    }
    catch (error) {
        logger.error('Error al obtener tramo por ID:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
exports.getAllTramos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Parámetros de paginación
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20; // Límite por defecto
        const skip = (page - 1) * limit;
        // Contar el total de tramos para la metadata
        const totalTramos = yield Tramo.countDocuments();
        // Obtener tramos con paginación
        const tramos = yield Tramo.find()
            .populate('origen', 'Site')
            .populate('destino', 'Site')
            .skip(skip)
            .limit(limit);
        res.json({
            success: true,
            data: tramos,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalTramos / limit),
                totalItems: totalTramos,
                limit: limit
            }
        });
    }
    catch (error) {
        logger.error('Error al obtener todos los tramos:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
exports.createTramo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tramoData = req.body;
        const nuevoTramo = new Tramo(tramoData);
        const tramoGuardado = yield nuevoTramo.save();
        // Poblar los campos de origen y destino
        yield tramoGuardado.populate('origen', 'Site');
        yield tramoGuardado.populate('destino', 'Site');
        res.status(201).json({
            success: true,
            data: tramoGuardado
        });
    }
    catch (error) {
        logger.error('Error al crear tramo:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
exports.updateTramo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const tramoActualizado = yield Tramo.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
            .populate('origen', 'Site')
            .populate('destino', 'Site');
        if (!tramoActualizado) {
            return res.status(404).json({
                success: false,
                message: 'Tramo no encontrado'
            });
        }
        res.json({
            success: true,
            data: tramoActualizado
        });
    }
    catch (error) {
        logger.error('Error al actualizar tramo:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
exports.deleteTramo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const tramoEliminado = yield Tramo.findByIdAndDelete(id);
        if (!tramoEliminado) {
            return res.status(404).json({
                success: false,
                message: 'Tramo no encontrado'
            });
        }
        res.json({
            success: true,
            message: 'Tramo eliminado correctamente'
        });
    }
    catch (error) {
        logger.error('Error al eliminar tramo:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
// Método para verificar duplicados
exports.verificarPosiblesDuplicados = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tramos, cliente } = req.body;
        if (!Array.isArray(tramos) || !cliente) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren tramos y cliente'
            });
        }
        // Cargar todos los tramos existentes
        const tramosExistentes = yield Tramo.find({ cliente }).lean();
        // Crear mapa de IDs de tramos
        const mapaExistentes = {};
        tramosExistentes.forEach(tramo => {
            const id = generarTramoId(tramo);
            if (!mapaExistentes[id]) {
                mapaExistentes[id] = [];
            }
            mapaExistentes[id].push(tramo);
        });
        // Resultados
        const resultado = {
            tramosVerificados: tramos.length,
            tramosExistentes: tramosExistentes.length,
            posiblesDuplicados: [],
            mapaIds: {}
        };
        // Verificar cada tramo
        for (const tramoData of tramos) {
            const id = generarTramoId(tramoData);
            // Contar IDs para análisis
            if (!resultado.mapaIds[id]) {
                resultado.mapaIds[id] = 0;
            }
            resultado.mapaIds[id]++;
            const tramosConMismoId = mapaExistentes[id] || [];
            // Verificar cada tramo existente con mismo ID
            for (const existente of tramosConMismoId) {
                if (fechasSuperpuestas(tramoData.vigenciaDesde, tramoData.vigenciaHasta, existente.vigenciaDesde, existente.vigenciaHasta)) {
                    resultado.posiblesDuplicados.push({
                        tipo: 'superposición',
                        nuevo: {
                            origen: tramoData.origenNombre || tramoData.origen,
                            destino: tramoData.destinoNombre || tramoData.destino,
                            tipo: tramoData.tipo,
                            id: id
                        },
                        existente: {
                            _id: existente._id,
                            origen: existente.origen,
                            destino: existente.destino,
                            tipo: existente.tipo,
                            vigenciaDesde: existente.vigenciaDesde,
                            vigenciaHasta: existente.vigenciaHasta
                        }
                    });
                }
            }
        }
        res.json({
            success: true,
            resultado
        });
    }
    catch (error) {
        logger.error('Error al verificar duplicados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar duplicados',
            error: error.message
        });
    }
});
// Método para verificar y normalizar los tipos de tramos
exports.normalizarTramos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const resultados = {
            procesados: 0,
            actualizados: 0,
            errores: []
        };
        // Contar total de tramos a procesar
        resultados.procesados = yield Tramo.countDocuments();
        // Normalizar los tipos en tarifasHistoricas - actualización masiva
        try {
            // Actualizar todos los tramos que tienen tarifas históricas con tipos no válidos o en minúsculas
            const resultTRMC = yield Tramo.updateMany({ 'tarifasHistoricas.tipo': { $regex: /^trmc$/i, $ne: 'TRMC' } }, { $set: { 'tarifasHistoricas.$[elem].tipo': 'TRMC' } }, { arrayFilters: [{ 'elem.tipo': { $regex: /^trmc$/i } }], multi: true });
            const resultTRMI = yield Tramo.updateMany({ 'tarifasHistoricas.tipo': { $regex: /^trmi$/i, $ne: 'TRMI' } }, { $set: { 'tarifasHistoricas.$[elem].tipo': 'TRMI' } }, { arrayFilters: [{ 'elem.tipo': { $regex: /^trmi$/i } }], multi: true });
            // Actualizar tarifas con tipos inválidos o nulos a 'TRMC'
            const resultNonValid = yield Tramo.updateMany({ 'tarifasHistoricas.tipo': { $nin: ['TRMC', 'TRMI', 'trmc', 'trmi'] } }, { $set: { 'tarifasHistoricas.$[elem].tipo': 'TRMC' } }, { arrayFilters: [{ 'elem.tipo': { $nin: ['TRMC', 'TRMI', 'trmc', 'trmi'] } }], multi: true });
            // Compatibilidad con modelo antiguo - actualizar campo tipo directamente
            const resultOldModel = yield Tramo.updateMany({ tipo: { $exists: true } }, [
                {
                    $set: {
                        tipo: {
                            $cond: [
                                { $regexMatch: { input: "$tipo", regex: /^trmi$/i } },
                                "TRMI",
                                "TRMC"
                            ]
                        }
                    }
                }
            ]);
            // Sumar todas las actualizaciones realizadas
            resultados.actualizados =
                (resultTRMC.modifiedCount || 0) +
                    (resultTRMI.modifiedCount || 0) +
                    (resultNonValid.modifiedCount || 0) +
                    (resultOldModel.modifiedCount || 0);
            logger.info(`Normalización masiva completada: ${resultados.actualizados} tramos actualizados`);
        }
        catch (error) {
            logger.error('Error en actualización masiva:', error);
            resultados.errores.push({
                fase: 'actualizacionMasiva',
                error: error.message
            });
        }
        res.json({
            success: true,
            resultados
        });
    }
    catch (error) {
        logger.error('Error normalizando tramos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al normalizar los tramos',
            error: error.message
        });
    }
});
// Nuevo método para probar la importación con diferentes tipos
exports.testImportacionTipos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { origen, destino, cliente } = req.body;
        if (!origen || !destino || !cliente) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren origen, destino y cliente para la prueba'
            });
        }
        // Crear fechas de vigencia
        const fechaInicio = new Date();
        const fechaFin = new Date();
        fechaFin.setFullYear(fechaFin.getFullYear() + 1); // Un año de vigencia
        // Crear un tramo con dos tarifas históricas de diferentes tipos
        const nuevoTramo = new Tramo({
            origen,
            destino,
            cliente,
            tarifasHistoricas: [
                {
                    tipo: 'TRMC',
                    metodoCalculo: 'Kilometro',
                    valor: 100,
                    valorPeaje: 0,
                    vigenciaDesde: fechaInicio,
                    vigenciaHasta: fechaFin
                },
                {
                    tipo: 'TRMI',
                    metodoCalculo: 'Kilometro',
                    valor: 200,
                    valorPeaje: 0,
                    vigenciaDesde: fechaInicio,
                    vigenciaHasta: fechaFin
                }
            ]
        });
        // Guardar el tramo
        yield nuevoTramo.save();
        res.json({
            success: true,
            message: 'Prueba completada correctamente',
            tramo: nuevoTramo
        });
    }
    catch (error) {
        logger.error('Error en prueba de importación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al realizar la prueba de importación',
            error: error.message
        });
    }
});
exports.updateVigenciaMasiva = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Modificado para aceptar tramoIds (lo que el frontend envía) en lugar de tramosIds
        const tramosIds = req.body.tramoIds;
        const vigenciaDesde = req.body.vigenciaDesde;
        const vigenciaHasta = req.body.vigenciaHasta;
        const tipoTramo = req.body.tipoTramo; // Opcional
        if (!tramosIds || !Array.isArray(tramosIds) || tramosIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un array de IDs de tramos'
            });
        }
        if (!vigenciaDesde || !vigenciaHasta) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren las fechas de vigencia'
            });
        }
        // Modificamos la creación de fechas para asegurar formato UTC
        const fechaDesde = new Date(vigenciaDesde);
        fechaDesde.setUTCHours(12, 0, 0, 0); // Mediodía UTC para evitar problemas de zona horaria
        const fechaHasta = new Date(vigenciaHasta);
        fechaHasta.setUTCHours(12, 0, 0, 0); // Mediodía UTC para evitar problemas de zona horaria
        if (fechaHasta < fechaDesde) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de fin debe ser posterior a la fecha de inicio'
            });
        }
        const actualizados = [];
        const conflictos = [];
        const noEncontrados = [];
        // Iterar sobre cada ID de tramo para procesarlo individualmente
        for (const tramoId of tramosIds) {
            try {
                const tramo = yield Tramo.findById(tramoId);
                if (!tramo) {
                    noEncontrados.push(tramoId);
                    logger.warn(`Tramo con ID ${tramoId} no encontrado para actualización masiva.`);
                    continue; // Pasar al siguiente ID
                }
                let tarifasModificadas = false;
                // Iterar sobre las tarifas históricas del tramo
                for (let i = 0; i < tramo.tarifasHistoricas.length; i++) {
                    const tarifa = tramo.tarifasHistoricas[i];
                    // Si se especificó un tipoTramo, solo modificar las tarifas de ese tipo
                    if (tipoTramo && tarifa.tipo !== tipoTramo) {
                        continue;
                    }
                    // Verificar conflicto ANTES de modificar:
                    // ¿Existe OTRA tarifa (j != i) del MISMO tipo y método que se superponga con las NUEVAS fechas?
                    const hayConflicto = tramo.tarifasHistoricas.some((otraTarifa, j) => i !== j && // No comparar consigo misma
                        otraTarifa.tipo === tarifa.tipo &&
                        otraTarifa.metodoCalculo === tarifa.metodoCalculo &&
                        // Comprobar superposición de fechas:
                        otraTarifa.vigenciaDesde <= fechaHasta &&
                        otraTarifa.vigenciaHasta >= fechaDesde);
                    if (hayConflicto) {
                        // Si encontramos un conflicto potencial con las nuevas fechas, registramos y saltamos esta tarifa
                        const errorMsg = `Conflicto potencial de fechas al actualizar tarifa (${tarifa.tipo}/${tarifa.metodoCalculo}) en tramo ${tramoId}.`;
                        logger.error(errorMsg);
                        conflictos.push({ id: tramoId, tarifaId: tarifa._id, error: errorMsg });
                        // Importante: No modificamos esta tarifa y continuamos el bucle interno
                        // para ver si otras tarifas del mismo tramo SÍ se pueden actualizar.
                    }
                    else {
                        // No hay conflicto para ESTA tarifa con las nuevas fechas, la modificamos.
                        tramo.tarifasHistoricas[i].vigenciaDesde = fechaDesde;
                        tramo.tarifasHistoricas[i].vigenciaHasta = fechaHasta;
                        tarifasModificadas = true;
                    }
                }
                // Si se modificó al menos una tarifa y no hubo errores de conflicto *durante la iteración anterior* 
                // (los conflictos detectados ya están en el array `conflictos`)
                // intentamos guardar el tramo. La validación pre-save actuará como doble chequeo.
                if (tarifasModificadas) {
                    try {
                        yield tramo.save();
                        actualizados.push(tramoId);
                        logger.debug(`Tramo ${tramoId} actualizado correctamente.`);
                    }
                    catch (saveError) {
                        // Error al guardar (probablemente validación del modelo)
                        logger.error(`Error al guardar tramo ${tramoId} tras actualización masiva: ${saveError.message}`);
                        conflictos.push({ id: tramoId, error: `Error al guardar: ${saveError.message}` });
                        // Si falló el save(), el tramo no se agrega a `actualizados`
                    }
                }
                else if (conflictos.some(c => c.id === tramoId)) {
                    // Si no se modificó nada PERO hubo conflictos reportados para este tramoId
                    logger.warn(`Tramo ${tramoId} no actualizado debido a conflictos de fechas detectados.`);
                }
                else {
                    // No se modificó ninguna tarifa (quizás no había del tipo especificado)
                    logger.info(`Tramo ${tramoId}: No se encontraron tarifas ${tipoTramo ? `del tipo ${tipoTramo} ` : ''}para actualizar.`);
                    // Opcionalmente, podrías agregarlo a una lista de 'no aplicables'
                }
            }
            catch (error) {
                // Error al buscar o procesar un tramo individual
                logger.error(`Error procesando tramo ${tramoId} en actualización masiva:`, error);
                conflictos.push({ id: tramoId, error: error.message });
            }
        }
        res.json({
            success: true,
            data: {
                actualizados,
                conflictos,
                noEncontrados,
                mensaje: `Proceso completado: ${actualizados.length} tramos actualizados, ${conflictos.length} conflictos, ${noEncontrados.length} no encontrados.`
            }
        });
    }
    catch (error) {
        logger.error('Error general en actualización masiva de vigencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al actualizar la vigencia de los tramos',
            error: error.message
        });
    }
});
/**
 * Calcula la tarifa para un tramo específico
 *
 * @async
 * @function calcularTarifa
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Tarifa calculada
 * @throws {Error} Error 500 si hay un error en el servidor
 */
exports.calcularTarifa = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cliente: clienteNombre, origen, destino, fecha, palets, tipoUnidad, tipoTramo, metodoCalculo, permitirTramoNoVigente, tramoId, tarifaHistoricaId } = req.body;
        if (!clienteNombre || !origen || !destino || !fecha || !tipoTramo) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }
        let tramo;
        const fechaConsulta = new Date(fecha);
        // Si se proporciona un ID de tramo específico y permitirTramoNoVigente es true
        if (tramoId && permitirTramoNoVigente === true) {
            logger.debug('Buscando tramo específico por ID:', tramoId, 'con permitirTramoNoVigente:', permitirTramoNoVigente);
            tramo = yield Tramo.findOne({
                _id: tramoId,
                cliente: clienteNombre,
                origen,
                destino
            }).populate('origen destino');
        }
        else {
            // Buscar tramo base (sin considerar tarifas históricas)
            logger.debug('Buscando tramo base para fecha:', fecha);
            tramo = yield Tramo.findOne({
                cliente: clienteNombre,
                origen,
                destino
            }).populate('origen destino');
        }
        if (!tramo) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró un tramo para la ruta especificada'
            });
        }
        // Buscar la tarifa histórica vigente para la fecha y tipo especificados o usar la tarifa específica si se proporciona su ID
        let tarifaSeleccionada;
        if (tarifaHistoricaId && tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
            // Si se proporciona un ID específico de tarifa histórica, usarla directamente
            logger.debug(`Buscando tarifa histórica específica por ID: ${tarifaHistoricaId}`);
            tarifaSeleccionada = tramo.tarifasHistoricas.find(t => t._id.toString() === tarifaHistoricaId.toString());
            if (tarifaSeleccionada) {
                logger.debug(`Usando tarifa histórica específica con ID ${tarifaHistoricaId}:`, {
                    tipo: tarifaSeleccionada.tipo,
                    metodo: tarifaSeleccionada.metodoCalculo,
                    valor: tarifaSeleccionada.valor,
                    peaje: tarifaSeleccionada.valorPeaje,
                    vigencia: `${new Date(tarifaSeleccionada.vigenciaDesde).toISOString()} - ${new Date(tarifaSeleccionada.vigenciaHasta).toISOString()}`
                });
            }
            else {
                logger.warn(`No se encontró la tarifa histórica con ID ${tarifaHistoricaId}`);
            }
        }
        // Si no se encuentra la tarifa específica, usar la lógica existente
        if (!tarifaSeleccionada) {
            const tarifaVigente = tramo.getTarifaVigente(fechaConsulta, tipoTramo);
            if (!tarifaVigente && !permitirTramoNoVigente) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontró una tarifa vigente de tipo ${tipoTramo} para la fecha ${fecha}`
                });
            }
            tarifaSeleccionada = tarifaVigente;
            // Si se especificó un método de cálculo, buscar una tarifa con ese método
            if (metodoCalculo && tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
                logger.debug(`Buscando tarifa con método de cálculo: ${metodoCalculo} y tipo: ${tipoTramo}`);
                // Primero buscar una tarifa vigente con el método de cálculo específico
                const tarifaEspecifica = tramo.tarifasHistoricas.find(t => t.tipo === tipoTramo &&
                    t.metodoCalculo === metodoCalculo &&
                    new Date(t.vigenciaDesde) <= fechaConsulta &&
                    new Date(t.vigenciaHasta) >= fechaConsulta);
                // Si no hay una vigente, usar cualquier tarifa con el método y tipo especificados
                if (!tarifaEspecifica && permitirTramoNoVigente) {
                    const tarifaNoVigente = tramo.tarifasHistoricas.find(t => t.tipo === tipoTramo &&
                        t.metodoCalculo === metodoCalculo);
                    if (tarifaNoVigente) {
                        tarifaSeleccionada = tarifaNoVigente;
                        logger.debug(`Usando tarifa no vigente con método: ${metodoCalculo}`);
                    }
                }
                else if (tarifaEspecifica) {
                    tarifaSeleccionada = tarifaEspecifica;
                    logger.debug(`Usando tarifa vigente con método: ${metodoCalculo}`);
                }
            }
        }
        // Obtenemos la información del cliente para sus fórmulas personalizadas
        const cliente = yield Cliente.findOne({ Cliente: clienteNombre });
        const numPalets = Number(palets) || 1;
        const tipoDeUnidad = tipoUnidad || 'Sider'; // Valor por defecto: Sider
        // Preparar los datos para el cálculo
        const tramoConTarifa = Object.assign(Object.assign({}, tramo.toObject()), { valor: tarifaSeleccionada ? tarifaSeleccionada.valor : (tramo.valor || 0), valorPeaje: tarifaSeleccionada ? tarifaSeleccionada.valorPeaje : (tramo.valorPeaje || 0), metodoCalculo: metodoCalculo || (tarifaSeleccionada ? tarifaSeleccionada.metodoCalculo : 'No disponible'), tipo: tarifaSeleccionada ? tarifaSeleccionada.tipo : tipoTramo });
        // Para asegurar que se utilicen exactamente los valores de la tarifa seleccionada, 
        // forzamos estos valores explícitamente
        if (tarifaSeleccionada) {
            logger.debug(`Aplicando valores exactos de la tarifa seleccionada (ID: ${tarifaSeleccionada._id}): valor=${tarifaSeleccionada.valor}, peaje=${tarifaSeleccionada.valorPeaje}`);
            tramoConTarifa.valor = tarifaSeleccionada.valor;
            tramoConTarifa.valorPeaje = tarifaSeleccionada.valorPeaje;
            tramoConTarifa.metodoCalculo = tarifaSeleccionada.metodoCalculo || tramoConTarifa.metodoCalculo;
        }
        logger.debug(`Datos de cálculo: método=${tramoConTarifa.metodoCalculo}, valor=${tramoConTarifa.valor}, peaje=${tramoConTarifa.valorPeaje}`);
        // Obtener la fórmula aplicable usando el nuevo servicio
        const clienteId = cliente ? cliente._id : null;
        if (clienteId && tramoConTarifa.metodoCalculo === 'Palet') {
            try {
                // Usar la fecha de vigencia de la tarifa seleccionada si está disponible
                // o la fecha de la consulta como respaldo
                let fechaDeCalculo;
                // Usar diferentes fechas en orden de prioridad
                if (tarifaSeleccionada && tarifaSeleccionada.vigenciaDesde) {
                    // 1. Usar la fecha específica de la tarifa
                    fechaDeCalculo = new Date(tarifaSeleccionada.vigenciaDesde);
                    logger.debug(`Usando fecha de vigencia de tarifa: ${fechaDeCalculo.toISOString()}`);
                }
                else if (fechaConsulta) {
                    // 2. Usar la fecha de consulta
                    fechaDeCalculo = fechaConsulta;
                    logger.debug(`Usando fecha de consulta: ${fechaDeCalculo.toISOString()}`);
                }
                else {
                    // 3. Usar fecha actual
                    fechaDeCalculo = new Date();
                    logger.debug(`Usando fecha actual: ${fechaDeCalculo.toISOString()}`);
                }
                logger.debug(`Información de tarifa seleccionada:
                    ID: ${tarifaSeleccionada === null || tarifaSeleccionada === void 0 ? void 0 : tarifaSeleccionada._id}
                    Tipo: ${tarifaSeleccionada === null || tarifaSeleccionada === void 0 ? void 0 : tarifaSeleccionada.tipo}
                    Método: ${tarifaSeleccionada === null || tarifaSeleccionada === void 0 ? void 0 : tarifaSeleccionada.metodoCalculo}
                    Valor: ${tarifaSeleccionada === null || tarifaSeleccionada === void 0 ? void 0 : tarifaSeleccionada.valor}
                    Vigencia: ${new Date((tarifaSeleccionada === null || tarifaSeleccionada === void 0 ? void 0 : tarifaSeleccionada.vigenciaDesde) || 0).toISOString()} - ${new Date((tarifaSeleccionada === null || tarifaSeleccionada === void 0 ? void 0 : tarifaSeleccionada.vigenciaHasta) || 0).toISOString()}`);
                try {
                    // Obtener la fórmula aplicable para este cliente, unidad y fecha
                    const formulaAplicable = yield formulaClienteService.getFormulaAplicable(clienteId, tipoDeUnidad, fechaDeCalculo);
                    logger.debug(`Fórmula aplicable para cliente ${clienteNombre}, unidad ${tipoDeUnidad}, fecha ${fechaDeCalculo.toISOString()}: ${formulaAplicable}`);
                    // Verificar si la fórmula es válida antes de usarla
                    let formulaAplicableCorregida = formulaAplicable;
                    if (!formulaAplicableCorregida) {
                        logger.warn(`No se encontró una fórmula personalizada específica, usando fórmula estándar`);
                        formulaAplicableCorregida = formulaClienteService.FORMULA_ESTANDAR;
                    }
                    // Asegurarse de que los valores del tramo son correctos
                    if (!tramoConTarifa.valor || tramoConTarifa.valor === 0) {
                        if (tarifaSeleccionada && tarifaSeleccionada.valor) {
                            tramoConTarifa.valor = tarifaSeleccionada.valor;
                            logger.debug(`Actualizando valor de tarifa a: ${tramoConTarifa.valor}`);
                        }
                    }
                    // Usar el servicio de tarifa con la fórmula aplicable
                    const resultado = tarifaService.calcularTarifaTramo(tramoConTarifa, numPalets, tipoTramo, formulaAplicableCorregida);
                    logger.debug(`Resultado del cálculo:
                        tarifaBase: ${resultado.tarifaBase}
                        peaje: ${resultado.peaje}
                        total: ${resultado.total}`);
                    // Asegurar que el total no sea NaN
                    if (isNaN(resultado.total)) {
                        logger.warn('El cálculo resultó en NaN, corrigiendo...');
                        resultado.total = resultado.tarifaBase + resultado.peaje;
                        logger.debug(`Total corregido: ${resultado.total}`);
                    }
                    // Si el total es 0, intentar con el método estándar
                    if (resultado.total === 0) {
                        logger.warn(`El cálculo con fórmula resultó en 0, intentando con método estándar`);
                        const resultadoEstandar = tarifaService.calcularTarifaTramo(Object.assign(Object.assign({}, tramoConTarifa), { metodoCalculo: 'Palet' }), numPalets, tipoTramo);
                        if (resultadoEstandar.total > 0) {
                            logger.debug(`Usando resultado de cálculo estándar: ${resultadoEstandar.total}`);
                            resultado.tarifaBase = resultadoEstandar.tarifaBase;
                            resultado.peaje = resultadoEstandar.peaje;
                            resultado.total = resultadoEstandar.total;
                        }
                    }
                    // Verificar una vez más si el total es NaN
                    if (isNaN(resultado.total)) {
                        logger.warn('El total sigue siendo NaN, usando cálculo básico');
                        resultado.tarifaBase = tramoConTarifa.valor * numPalets;
                        resultado.total = resultado.tarifaBase + resultado.peaje;
                    }
                    // Convertir los resultados a números fijos con 2 decimales
                    const resultadoFinal = {
                        tarifaBase: resultado.tarifaBase,
                        peaje: resultado.peaje,
                        total: resultado.total,
                        detalles: {
                            origen: tramo.origen.Site,
                            destino: tramo.destino.Site,
                            distancia: tramo.distancia,
                            metodoCalculo: tramoConTarifa.metodoCalculo,
                            tipo: tramoConTarifa.tipo,
                            tipoUnidad: tipoDeUnidad,
                            valor: tramoConTarifa.valor,
                            valorPeaje: tramoConTarifa.valorPeaje,
                            vigenciaDesde: tarifaSeleccionada ? tarifaSeleccionada.vigenciaDesde : null,
                            vigenciaHasta: tarifaSeleccionada ? tarifaSeleccionada.vigenciaHasta : null
                        },
                        formula: formulaAplicableCorregida,
                        tarifaHistoricaId: tarifaSeleccionada ? tarifaSeleccionada._id : null
                    };
                    res.json({
                        success: true,
                        data: resultadoFinal
                    });
                    return;
                }
                catch (error) {
                    logger.error(`Error al calcular tarifa con fórmula personalizada: ${error.message}`, error);
                    // Si llegamos aquí, es porque no se usó una fórmula personalizada o hubo un error
                    // Vamos a asegurarnos de que los valores en tramoConTarifa son correctos
                    // Verificar si los valores son 0 o nulos, y tratar de obtenerlos de la tarifa seleccionada
                    if (!tramoConTarifa.valor || tramoConTarifa.valor === 0) {
                        if (tarifaSeleccionada && tarifaSeleccionada.valor) {
                            tramoConTarifa.valor = tarifaSeleccionada.valor;
                            logger.debug(`Usando valor de tarifa seleccionada: ${tramoConTarifa.valor}`);
                        }
                    }
                    // Calcular usando el método estándar correspondiente
                    logger.debug(`Realizando cálculo estándar con método: ${tramoConTarifa.metodoCalculo}`);
                    const resultado = tarifaService.calcularTarifaTramo(tramoConTarifa, numPalets, tipoTramo);
                    logger.debug(`Resultado del cálculo estándar:
                        tarifaBase: ${resultado.tarifaBase}
                        peaje: ${resultado.peaje}
                        total: ${resultado.total}`);
                    // Convertir los resultados a números fijos con 2 decimales
                    const resultadoFinal = {
                        tarifaBase: resultado.tarifaBase,
                        peaje: resultado.peaje,
                        total: resultado.total,
                        detalles: {
                            origen: tramo.origen.Site,
                            destino: tramo.destino.Site,
                            distancia: tramo.distancia,
                            metodoCalculo: tramoConTarifa.metodoCalculo,
                            tipo: tramoConTarifa.tipo,
                            tipoUnidad: tipoDeUnidad,
                            valor: tramoConTarifa.valor,
                            valorPeaje: tramoConTarifa.valorPeaje,
                            vigenciaDesde: tarifaSeleccionada ? tarifaSeleccionada.vigenciaDesde : null,
                            vigenciaHasta: tarifaSeleccionada ? tarifaSeleccionada.vigenciaHasta : null
                        },
                        formula: 'Estándar',
                        tarifaHistoricaId: tarifaSeleccionada ? tarifaSeleccionada._id : null
                    };
                    res.json({
                        success: true,
                        data: resultadoFinal
                    });
                }
            }
            catch (error) {
                logger.error(`Error al calcular tarifa con fórmula personalizada: ${error.message}`, error);
                // Si llegamos aquí, es porque no se usó una fórmula personalizada o hubo un error
                // Vamos a asegurarnos de que los valores en tramoConTarifa son correctos
                // Verificar si los valores son 0 o nulos, y tratar de obtenerlos de la tarifa seleccionada
                if (!tramoConTarifa.valor || tramoConTarifa.valor === 0) {
                    if (tarifaSeleccionada && tarifaSeleccionada.valor) {
                        tramoConTarifa.valor = tarifaSeleccionada.valor;
                        logger.debug(`Usando valor de tarifa seleccionada: ${tramoConTarifa.valor}`);
                    }
                }
                // Calcular usando el método estándar correspondiente
                logger.debug(`Realizando cálculo estándar con método: ${tramoConTarifa.metodoCalculo}`);
                const resultado = tarifaService.calcularTarifaTramo(tramoConTarifa, numPalets, tipoTramo);
                logger.debug(`Resultado del cálculo estándar:
                    tarifaBase: ${resultado.tarifaBase}
                    peaje: ${resultado.peaje}
                    total: ${resultado.total}`);
                // Convertir los resultados a números fijos con 2 decimales
                const resultadoFinal = {
                    tarifaBase: resultado.tarifaBase,
                    peaje: resultado.peaje,
                    total: resultado.total,
                    detalles: {
                        origen: tramo.origen.Site,
                        destino: tramo.destino.Site,
                        distancia: tramo.distancia,
                        metodoCalculo: tramoConTarifa.metodoCalculo,
                        tipo: tramoConTarifa.tipo,
                        tipoUnidad: tipoDeUnidad,
                        valor: tramoConTarifa.valor,
                        valorPeaje: tramoConTarifa.valorPeaje,
                        vigenciaDesde: tarifaSeleccionada ? tarifaSeleccionada.vigenciaDesde : null,
                        vigenciaHasta: tarifaSeleccionada ? tarifaSeleccionada.vigenciaHasta : null
                    },
                    formula: 'Estándar',
                    tarifaHistoricaId: tarifaSeleccionada ? tarifaSeleccionada._id : null
                };
                res.json({
                    success: true,
                    data: resultadoFinal
                });
            }
        }
        // Usar el servicio para calcular la tarifa con el método original
        logger.debug(`Realizando cálculo estándar final con valores directos de tarifa: valor=${tramoConTarifa.valor}, peaje=${tramoConTarifa.valorPeaje}, método=${tramoConTarifa.metodoCalculo}`);
        const resultado = tarifaService.calcularTarifaTramo(tramoConTarifa, numPalets, tipoTramo);
        // Convertir los resultados a números fijos con 2 decimales
        const resultadoFinal = {
            tarifaBase: resultado.tarifaBase,
            peaje: resultado.peaje,
            total: resultado.total,
            detalles: {
                origen: tramo.origen.Site,
                destino: tramo.destino.Site,
                distancia: tramo.distancia,
                metodoCalculo: tramoConTarifa.metodoCalculo,
                tipo: tramoConTarifa.tipo,
                tipoUnidad: tipoDeUnidad,
                valor: tramoConTarifa.valor,
                valorPeaje: tramoConTarifa.valorPeaje,
                vigenciaDesde: tarifaSeleccionada ? tarifaSeleccionada.vigenciaDesde : null,
                vigenciaHasta: tarifaSeleccionada ? tarifaSeleccionada.vigenciaHasta : null
            },
            formula: 'Estándar',
            tarifaHistoricaId: tarifaSeleccionada ? tarifaSeleccionada._id : null
        };
        res.json({
            success: true,
            data: resultadoFinal
        });
    }
    catch (error) {
        logger.error('Error al calcular tarifa:', error);
        res.status(500).json({
            success: false,
            message: 'Error al calcular la tarifa',
            error: error.message
        });
    }
});
// Export the module
module.exports = exports;
//# sourceMappingURL=tramoController.js.map