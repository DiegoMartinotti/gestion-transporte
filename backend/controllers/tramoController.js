/**
 * @module controllers/tramoController
 * @description Controlador para gestionar los tramos de transporte
 */

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
exports.getTramosByCliente = async (req, res) => {
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
        
        // Etapa 2: Lookup para enriquecer datos de origen y destino
        // Realizamos una operación de join con la colección de sites para obtener
        // la información completa de los sitios de origen y destino
        pipeline.push(
            { 
                $lookup: {
                    from: 'sites',
                    localField: 'origen',
                    foreignField: '_id',
                    as: 'origenData'
                }
            },
            { 
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
            }
        );
        
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
            pipeline.push(
                {
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
                { $replaceRoot: { newRoot: '$combinedResults' } }
            );
        } else {
            // Etapa 3b: Procesamiento normal (sin filtro de fechas históricas)
            // Similar al procesamiento histórico pero sin filtrar por fechas de vigencia
            pipeline.push(
                {
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
                },
                { $unwind: '$combinedResults' },
                { $replaceRoot: { newRoot: '$combinedResults' } }
            );
        }
        
        // Etapa 4: Ordenamiento final de los resultados
        // Organizamos los tramos por origen, destino y tipo para una visualización consistente
        pipeline.push(
            {
                $sort: {
                    'origen.Site': 1,
                    'destino.Site': 1,
                    tipo: 1
                }
            }
        );
        
        // Etapa 5: Paginación y metadatos
        // Calculamos el total de documentos y aplicamos skip/limit para paginación
        pipeline.push(
            {
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [{ $skip: skip }, { $limit: limit }]
                }
            }
        );
        
        // Ejecutar la agregación
        const [result] = await Tramo.aggregate(pipeline);
        
        // Extraer los datos y metadata
        const totalTramos = result.metadata[0]?.total || 0;
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
    } catch (error) {
        logger.error('Error al obtener tramos por cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tramos',
            error: error.message
        });
    }
};

exports.getDistanciasCalculadas = async (req, res) => {
    try {
        // Obtener todas las distancias calculadas de tramos existentes
        const distancias = await Tramo.aggregate([
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
    } catch (error) {
        logger.error('Error al obtener distancias calculadas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener distancias calculadas',
            error: error.message
        });
    }
};

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
exports.bulkCreateTramos = async (req, res) => {
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
        
        // Resultados
        const resultados = {
            total: tramos.length,
            exitosos: 0,
            errores: [],
            tramosCreados: 0,
            tramosActualizados: 0
        };
        
        // Cargar todos los tramos existentes para este cliente
        const tramosExistentes = await Tramo.find({ 
            cliente: cliente 
        });
        
        logger.debug(`Se encontraron ${tramosExistentes.length} tramos existentes para el cliente ${cliente}`);
        
        // Crear un mapa para búsqueda rápida de tramos existentes
        const mapaTramos = {};
        tramosExistentes.forEach(tramo => {
            // Incluir el tipo en la clave para diferenciar entre TRMC y TRMI
            if (tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
                // Crear una entrada para cada tipo de tarifa histórica
                const tiposUnicos = new Set(tramo.tarifasHistoricas.map(t => t.tipo));
                tiposUnicos.forEach(tipo => {
                    const key = `${tramo.origen}-${tramo.destino}-${tipo}`;
                    mapaTramos[key] = tramo;
                });
            } else {
                // Si no tiene tarifas históricas, usar la clave básica
                const key = `${tramo.origen}-${tramo.destino}`;
                mapaTramos[key] = tramo;
            }
        });
        
        // Procesar cada tramo
        for (let i = 0; i < tramos.length; i++) {
            try {
                const tramoData = tramos[i];
                
                // Validación básica
                if (!tramoData.origen) {
                    throw new Error(`Origen no definido en tramo #${i+1}`);
                }

                if (!tramoData.destino) {
                    throw new Error(`Destino no definido en tramo #${i+1}`);
                }
                
                // Verificar si tenemos una tarifa histórica
                if (!tramoData.tarifaHistorica) {
                    // Compatibilidad con formato antiguo
                    if (tramoData.tipo && (tramoData.vigenciaDesde || tramoData.vigenciaHasta)) {
                        tramoData.tarifaHistorica = {
                            tipo: tramoData.tipo,
                            metodoCalculo: tramoData.metodoCalculo || 'Kilometro',
                            valor: parseFloat(tramoData.valor) || 0,
                            valorPeaje: parseFloat(tramoData.valorPeaje) || 0,
                            vigenciaDesde: tramoData.vigenciaDesde,
                            vigenciaHasta: tramoData.vigenciaHasta
                        };
                    } else {
                        throw new Error(`Datos de tarifa no definidos en tramo #${i+1}`);
                    }
                }
                
                // Validar datos de la tarifa
                if (!tramoData.tarifaHistorica.vigenciaDesde) {
                    throw new Error(`Fecha inicio vigencia no definida en tramo #${i+1}`);
                }

                if (!tramoData.tarifaHistorica.vigenciaHasta) {
                    throw new Error(`Fecha fin vigencia no definida en tramo #${i+1}`);
                }
                
                // Normalizar tipo de tramo
                tramoData.tarifaHistorica.tipo = tramoData.tarifaHistorica.tipo?.toUpperCase() || 'TRMC';
                
                // Procesar fechas
                let fechaDesde = new Date(tramoData.tarifaHistorica.vigenciaDesde);
                let fechaHasta = new Date(tramoData.tarifaHistorica.vigenciaHasta);
                
                if (isNaN(fechaDesde.getTime())) {
                    throw new Error(`Fecha de inicio inválida en tramo #${i+1}: ${tramoData.tarifaHistorica.vigenciaDesde}`);
                }
                
                if (isNaN(fechaHasta.getTime())) {
                    throw new Error(`Fecha de fin inválida en tramo #${i+1}: ${tramoData.tarifaHistorica.vigenciaHasta}`);
                }
                
                // Verificar si ya existe un tramo con el mismo origen y destino
                const tramoKey = `${tramoData.origen}-${tramoData.destino}-${tramoData.tarifaHistorica.tipo}`;
                const tramoExistente = mapaTramos[tramoKey];
                
                if (tramoExistente && actualizarExistentes) {
                    logger.debug(`Encontrado tramo existente para ${tramoData.origenNombre || tramoData.origen} → ${tramoData.destinoNombre || tramoData.destino}`);
                    logger.debug(`Tarifas existentes: ${tramoExistente.tarifasHistoricas.length}`);
                    
                    // Verificar si ya existe una tarifa con el mismo tipo, método y fechas superpuestas
                    const nuevaTarifa = {
                        tipo: tramoData.tarifaHistorica.tipo,
                        metodoCalculo: tramoData.tarifaHistorica.metodoCalculo || 'Kilometro',
                        valor: parseFloat(tramoData.tarifaHistorica.valor) || 0,
                        valorPeaje: parseFloat(tramoData.tarifaHistorica.valorPeaje) || 0,
                        vigenciaDesde: fechaDesde,
                        vigenciaHasta: fechaHasta
                    };
                    
                    logger.debug(`Nueva tarifa a agregar: ${nuevaTarifa.tipo}/${nuevaTarifa.metodoCalculo} - Vigencia: ${format(nuevaTarifa.vigenciaDesde, 'dd/MM/yyyy')} - ${format(nuevaTarifa.vigenciaHasta, 'dd/MM/yyyy')}`);
                    
                    // Verificar si hay superposición con tarifas existentes
                    let hayConflicto = false;
                    for (const tarifaExistente of tramoExistente.tarifasHistoricas) {
                        // Agregar logging para depurar el problema
                        logger.debug(`Comparando tarifas - Nueva: ${nuevaTarifa.tipo}/${nuevaTarifa.metodoCalculo}, Existente: ${tarifaExistente.tipo}/${tarifaExistente.metodoCalculo}`);
                        
                        // Solo verificamos conflicto si tienen el mismo tipo y método de cálculo
                        if (tarifaExistente.tipo === nuevaTarifa.tipo && 
                            tarifaExistente.metodoCalculo === nuevaTarifa.metodoCalculo) {
                            
                            logger.debug(`Verificando superposición con tarifa existente: ${tarifaExistente.tipo}/${tarifaExistente.metodoCalculo} - Vigencia: ${format(tarifaExistente.vigenciaDesde, 'dd/MM/yyyy')} - ${format(tarifaExistente.vigenciaHasta, 'dd/MM/yyyy')}`);
                            
                            // Verificar superposición de fechas
                            if (fechasSuperpuestas(
                                nuevaTarifa.vigenciaDesde,
                                nuevaTarifa.vigenciaHasta,
                                tarifaExistente.vigenciaDesde,
                                tarifaExistente.vigenciaHasta
                            )) {
                                hayConflicto = true;
                                
                                // Registrar el error con más detalles para depuración
                                const errorMsg = `Conflicto de fechas con tarifa existente: ${format(tarifaExistente.vigenciaDesde, 'dd/MM/yyyy')} - ${format(tarifaExistente.vigenciaHasta, 'dd/MM/yyyy')} para tramo ${tramoData.origenNombre || tramoData.origen} → ${tramoData.destinoNombre || tramoData.destino} (${nuevaTarifa.tipo}/${nuevaTarifa.metodoCalculo})`;
                                
                                logger.error(errorMsg);
                                
                                resultados.errores.push({
                                    tramo: i+1,
                                    error: errorMsg,
                                    detalles: {
                                        origen: tramoData.origenNombre || tramoData.origen,
                                        destino: tramoData.destinoNombre || tramoData.destino,
                                        tipo: nuevaTarifa.tipo,
                                        metodoCalculo: nuevaTarifa.metodoCalculo,
                                        vigenciaDesdeNueva: format(nuevaTarifa.vigenciaDesde, 'dd/MM/yyyy'),
                                        vigenciaHastaNueva: format(nuevaTarifa.vigenciaHasta, 'dd/MM/yyyy'),
                                        vigenciaDesdeExistente: format(tarifaExistente.vigenciaDesde, 'dd/MM/yyyy'),
                                        vigenciaHastaExistente: format(tarifaExistente.vigenciaHasta, 'dd/MM/yyyy')
                                    }
                                });
                                
                                break;
                            }
                        }
                    }
                    
                    if (!hayConflicto) {
                        // Agregar la nueva tarifa al tramo existente
                        tramoExistente.tarifasHistoricas.push(nuevaTarifa);
                        
                        // Guardar el tramo actualizado
                        await tramoExistente.save();
                        
                        resultados.exitosos++;
                        resultados.tramosActualizados++;
                        logger.debug(`Tramo #${i+1} actualizado exitosamente con nueva tarifa: ${tramoData.origenNombre || tramoData.origen} → ${tramoData.destinoNombre || tramoData.destino} (${nuevaTarifa.tipo}/${nuevaTarifa.metodoCalculo})`);
                    } else {
                        logger.error(`Conflicto de fechas en tramo #${i+1}: ${tramoData.origenNombre || tramoData.origen} → ${tramoData.destinoNombre || tramoData.destino}`);
                        throw new Error(`Conflicto de fechas con tarifa existente en tramo #${i+1}`);
                    }
                } else if (tramoExistente && !actualizarExistentes) {
                    // Si existe pero no queremos actualizar, reportar error
                    resultados.errores.push({
                        tramo: i+1,
                        error: `Ya existe un tramo con el mismo origen y destino para este cliente`
                    });
                    
                    logger.error(`Tramo duplicado #${i+1}: ${tramoData.origenNombre || tramoData.origen} → ${tramoData.destinoNombre || tramoData.destino}`);
                } else {
                    // Crear un nuevo tramo
                    // Obtener información de los sitios para calcular distancia si es necesario
                    const origenSite = await Site.findById(tramoData.origen).select('Site location');
                    const destinoSite = await Site.findById(tramoData.destino).select('Site location');
                    
                    if (!origenSite) {
                        throw new Error(`Sitio de origen no encontrado: ${tramoData.origen}`);
                    }
                    
                    if (!destinoSite) {
                        throw new Error(`Sitio de destino no encontrado: ${tramoData.destino}`);
                    }
                    
                    // Crear el objeto de tramo
                    const nuevoTramo = new Tramo({
                        origen: tramoData.origen,
                        destino: tramoData.destino,
                        cliente,
                        distancia: tramoData.distanciaPreCalculada || 0,
                        tarifasHistoricas: [{
                            tipo: tramoData.tarifaHistorica.tipo,
                            metodoCalculo: tramoData.tarifaHistorica.metodoCalculo || 'Kilometro',
                            valor: parseFloat(tramoData.tarifaHistorica.valor) || 0,
                            valorPeaje: parseFloat(tramoData.tarifaHistorica.valorPeaje) || 0,
                            vigenciaDesde: fechaDesde,
                            vigenciaHasta: fechaHasta
                        }]
                    });
                    
                    // Si no tenemos distancia pre-calculada y tenemos coordenadas, calcular distancia
                    if ((!nuevoTramo.distancia || nuevoTramo.distancia === 0) && 
                        origenSite?.location?.coordinates?.length === 2 && 
                        destinoSite?.location?.coordinates?.length === 2) {
                        
                        try {
                            const distanciaKm = await calcularDistanciaRuta(
                                origenSite.location.coordinates, 
                                destinoSite.location.coordinates
                            );
                            
                            nuevoTramo.distancia = distanciaKm;
                            logger.debug(`Distancia calculada para tramo #${i+1}: ${distanciaKm} km`);
                        } catch (routeError) {
                            logger.error(`Error calculando distancia para tramo #${i+1}:`, routeError);
                            // No interrumpimos el guardado si falla el cálculo de distancia
                        }
                    }
                    
                    // Guardar el nuevo tramo
                    await nuevoTramo.save();
                    
                    // Actualizar el mapa de tramos existentes
                    // Actualizar el mapa de tramos existentes con el nuevo tipo específico
                     const nuevoTipo = tramoData.tarifaHistorica.tipo;
                     const nuevoTramoKey = `${tramoData.origen}-${tramoData.destino}-${nuevoTipo}`;
                     mapaTramos[nuevoTramoKey] = nuevoTramo;
                    
                    resultados.exitosos++;
                    resultados.tramosCreados++;
                    logger.debug(`Tramo #${i+1} creado exitosamente`);
                }
            } catch (error) {
                logger.error(`Error procesando tramo #${i+1}:`, error);
                logger.error(`Detalles del error:`, error);
                logger.error(`Datos del tramo con error:`, JSON.stringify(tramos[i]));
                
                resultados.errores.push({
                    tramo: i+1,
                    error: error.message || 'Error desconocido'
                });
            }
        }
        
        // Mejor información en la respuesta
        res.json({
            success: true,
            mensaje: `Importación completada: ${resultados.exitosos} de ${resultados.total} tramos procesados (${resultados.tramosCreados} creados, ${resultados.tramosActualizados} actualizados)`,
            exitosos: resultados.exitosos,
            errores: resultados.errores,
            total: resultados.total,
            tramosCreados: resultados.tramosCreados,
            tramosActualizados: resultados.tramosActualizados,
            porcentajeExito: resultados.total > 0 ? 
                Math.round((resultados.exitosos / resultados.total) * 100) : 0
        });
    } catch (error) {
        logger.error('Error en importación masiva:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error en la importación masiva',
            error: error.message
        });
    }
};

exports.getVigentesByFecha = async (req, res) => {
    try {
        const { fecha } = req.params;
        const fechaBusqueda = new Date(fecha);
        
        if (isNaN(fechaBusqueda.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Formato de fecha inválido'
            });
        }
        
        const tramos = await Tramo.find({
            vigenciaDesde: { $lte: fechaBusqueda },
            vigenciaHasta: { $gte: fechaBusqueda }
        })
        .populate('origen', 'Site')
        .populate('destino', 'Site');
        
        res.json({
            success: true,
            data: tramos
        });
    } catch (error) {
        logger.error('Error al obtener tramos vigentes:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getTramoById = async (req, res) => {
    try {
        const { id } = req.params;
        const tramo = await Tramo.findById(id)
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
    } catch (error) {
        logger.error('Error al obtener tramo por ID:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getAllTramos = async (req, res) => {
    try {
        // Parámetros de paginación
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20; // Límite por defecto
        const skip = (page - 1) * limit;
        
        // Contar el total de tramos para la metadata
        const totalTramos = await Tramo.countDocuments();
        
        // Obtener tramos con paginación
        const tramos = await Tramo.find()
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
    } catch (error) {
        logger.error('Error al obtener todos los tramos:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.createTramo = async (req, res) => {
    try {
        const tramoData = req.body;
        const nuevoTramo = new Tramo(tramoData);
        const tramoGuardado = await nuevoTramo.save();
        
        // Poblar los campos de origen y destino
        await tramoGuardado.populate('origen', 'Site');
        await tramoGuardado.populate('destino', 'Site');
        
        res.status(201).json({
            success: true,
            data: tramoGuardado
        });
    } catch (error) {
        logger.error('Error al crear tramo:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateTramo = async (req, res) => {
    try {
        const { id } = req.params;
        const tramoActualizado = await Tramo.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        )
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
    } catch (error) {
        logger.error('Error al actualizar tramo:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteTramo = async (req, res) => {
    try {
        const { id } = req.params;
        const tramoEliminado = await Tramo.findByIdAndDelete(id);
        
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
    } catch (error) {
        logger.error('Error al eliminar tramo:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Método para verificar duplicados
exports.verificarPosiblesDuplicados = async (req, res) => {
    try {
        const { tramos, cliente } = req.body;
        
        if (!Array.isArray(tramos) || !cliente) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren tramos y cliente'
            });
        }
        
        // Cargar todos los tramos existentes
        const tramosExistentes = await Tramo.find({ cliente }).lean();
        
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
                if (fechasSuperpuestas(
                    tramoData.vigenciaDesde,
                    tramoData.vigenciaHasta,
                    existente.vigenciaDesde,
                    existente.vigenciaHasta
                )) {
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
    } catch (error) {
        logger.error('Error al verificar duplicados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar duplicados',
            error: error.message
        });
    }
};

// Método para verificar y normalizar los tipos de tramos
exports.normalizarTramos = async (req, res) => {
    try {
        const resultados = {
            procesados: 0,
            actualizados: 0,
            errores: []
        };

        // Contar total de tramos a procesar
        resultados.procesados = await Tramo.countDocuments();
        
        // Normalizar los tipos en tarifasHistoricas - actualización masiva
        try {
            // Actualizar todos los tramos que tienen tarifas históricas con tipos no válidos o en minúsculas
            const resultTRMC = await Tramo.updateMany(
                { 'tarifasHistoricas.tipo': { $regex: /^trmc$/i, $ne: 'TRMC' } },
                { $set: { 'tarifasHistoricas.$[elem].tipo': 'TRMC' } },
                { arrayFilters: [{ 'elem.tipo': { $regex: /^trmc$/i } }], multi: true }
            );
            
            const resultTRMI = await Tramo.updateMany(
                { 'tarifasHistoricas.tipo': { $regex: /^trmi$/i, $ne: 'TRMI' } },
                { $set: { 'tarifasHistoricas.$[elem].tipo': 'TRMI' } },
                { arrayFilters: [{ 'elem.tipo': { $regex: /^trmi$/i } }], multi: true }
            );
            
            // Actualizar tarifas con tipos inválidos o nulos a 'TRMC'
            const resultNonValid = await Tramo.updateMany(
                { 'tarifasHistoricas.tipo': { $nin: ['TRMC', 'TRMI', 'trmc', 'trmi'] } },
                { $set: { 'tarifasHistoricas.$[elem].tipo': 'TRMC' } },
                { arrayFilters: [{ 'elem.tipo': { $nin: ['TRMC', 'TRMI', 'trmc', 'trmi'] } }], multi: true }
            );
            
            // Compatibilidad con modelo antiguo - actualizar campo tipo directamente
            const resultOldModel = await Tramo.updateMany(
                { tipo: { $exists: true } },
                [
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
                ]
            );
            
            // Sumar todas las actualizaciones realizadas
            resultados.actualizados = 
                (resultTRMC.modifiedCount || 0) + 
                (resultTRMI.modifiedCount || 0) + 
                (resultNonValid.modifiedCount || 0) + 
                (resultOldModel.modifiedCount || 0);
                
            logger.info(`Normalización masiva completada: ${resultados.actualizados} tramos actualizados`);
            
        } catch (error) {
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
    } catch (error) {
        logger.error('Error normalizando tramos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al normalizar los tramos',
            error: error.message
        });
    }
};

// Nuevo método para probar la importación con diferentes tipos
exports.testImportacionTipos = async (req, res) => {
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
        await nuevoTramo.save();
        
        res.json({
            success: true,
            message: 'Prueba completada correctamente',
            tramo: nuevoTramo
        });
    } catch (error) {
        logger.error('Error en prueba de importación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al realizar la prueba de importación',
            error: error.message
        });
    }
};

exports.updateVigenciaMasiva = async (req, res) => {
    try {
        const { tramosIds, vigenciaDesde, vigenciaHasta, cliente, tipoTramo } = req.body;

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

        const fechaDesde = new Date(vigenciaDesde);
        const fechaHasta = new Date(vigenciaHasta);

        if (fechaHasta < fechaDesde) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de fin debe ser posterior a la fecha de inicio'
            });
        }

        const actualizados = [];
        const conflictos = [];

        // Si se especificó un tipo de tramo, verificamos conflictos primero
        if (tipoTramo) {
            // Verificamos conflictos de fechas para el tipo específico
            const tramosConflicto = await Tramo.aggregate([
                { 
                    $match: { 
                        _id: { $in: tramosIds.map(id => mongoose.Types.ObjectId(id)) } 
                    } 
                },
                { $unwind: '$tarifasHistoricas' },
                {
                    $match: {
                        'tarifasHistoricas.tipo': tipoTramo,
                        $or: [
                            // Buscar tarifas del mismo tipo que podrían generar conflictos
                            {
                                $and: [
                                    { 'tarifasHistoricas.vigenciaDesde': { $lte: fechaHasta } },
                                    { 'tarifasHistoricas.vigenciaHasta': { $gte: fechaDesde } },
                                    // Excluir la que estamos actualizando actual (si existe)
                                    { 
                                        $or: [
                                            { 'tarifasHistoricas._id': { $exists: false } },
                                            // Aquí no podemos filtrar por _id específico porque no lo conocemos
                                            // Verificaremos conflictos tramo por tramo más adelante
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        conflictos: { $push: '$tarifasHistoricas' }
                    }
                }
            ]);
            
            // Marcar los tramos con conflictos
            const tramosConConflicto = new Set(tramosConflicto.map(t => t._id.toString()));
            
            // Procesar cada tramo individualmente cuando hay un tipo específico
            // porque necesitamos identificar exactamente qué tarifa actualizar y verificar conflictos más detalladamente
            for (const tramoId of tramosIds) {
                try {
                    if (tramosConConflicto.has(tramoId.toString())) {
                        // Verificar si tiene múltiples tarifas del mismo tipo que generarían conflicto
                        const tramo = await Tramo.findById(tramoId);
                        
                        if (!tramo) {
                            conflictos.push({ id: tramoId, error: 'Tramo no encontrado' });
                            continue;
                        }
                        
                        // Encontrar la tarifa a actualizar
                        const tarifaIndex = tramo.tarifasHistoricas.findIndex(t => t.tipo === tipoTramo);
                        
                        if (tarifaIndex === -1) {
                            conflictos.push({ 
                                id: tramoId, 
                                error: `No se encontró una tarifa con tipo ${tipoTramo}` 
                            });
                            continue;
                        }
                        
                        // Verificar conflictos con otras tarifas del mismo tipo
                        const hayConflicto = tramo.tarifasHistoricas.some((t, i) => 
                            i !== tarifaIndex && 
                            t.tipo === tipoTramo && 
                            t.vigenciaDesde <= fechaHasta && 
                            t.vigenciaHasta >= fechaDesde
                        );
                        
                        if (hayConflicto) {
                            conflictos.push({
                                id: tramoId,
                                error: `Ya existe una tarifa con tipo ${tipoTramo} y fechas que se superponen`
                            });
                            continue;
                        }
                        
                        // Actualizar la tarifa específica
                        tramo.tarifasHistoricas[tarifaIndex].vigenciaDesde = fechaDesde;
                        tramo.tarifasHistoricas[tarifaIndex].vigenciaHasta = fechaHasta;
                        await tramo.save();
                        actualizados.push(tramoId);
                    } else {
                        // No hay conflictos, podemos actualizar directamente
                        await Tramo.updateOne(
                            { 
                                _id: tramoId,
                                'tarifasHistoricas.tipo': tipoTramo 
                            },
                            { 
                                $set: { 
                                    'tarifasHistoricas.$.vigenciaDesde': fechaDesde,
                                    'tarifasHistoricas.$.vigenciaHasta': fechaHasta 
                                } 
                            }
                        );
                        actualizados.push(tramoId);
                    }
                } catch (error) {
                    logger.error(`Error actualizando tramo ${tramoId}:`, error);
                    conflictos.push({ id: tramoId, error: error.message });
                }
            }
        } else {
            // Si no se especificó tipo, actualizamos todas las tarifas de todos los tramos en una operación
            // (no hay riesgo de conflicto interno porque todas las tarifas tendrán la misma vigencia)
            try {
                // Para tramos con modelo nuevo (tarifasHistoricas)
                const resultTarifasHistoricas = await Tramo.updateMany(
                    { 
                        _id: { $in: tramosIds },
                        tarifasHistoricas: { $exists: true, $not: { $size: 0 } }
                    },
                    {
                        $set: {
                            'tarifasHistoricas.$[].vigenciaDesde': fechaDesde,
                            'tarifasHistoricas.$[].vigenciaHasta': fechaHasta
                        }
                    }
                );
                
                // Para tramos con modelo antiguo (campos directos)
                const resultTramoAntiguo = await Tramo.updateMany(
                    { 
                        _id: { $in: tramosIds },
                        $or: [
                            { tarifasHistoricas: { $exists: false } },
                            { tarifasHistoricas: { $size: 0 } }
                        ]
                    },
                    {
                        $set: {
                            vigenciaDesde: fechaDesde,
                            vigenciaHasta: fechaHasta
                        }
                    }
                );
                
                // Marcar todos como actualizados
                const totalActualizados = (resultTarifasHistoricas.modifiedCount || 0) + 
                                         (resultTramoAntiguo.modifiedCount || 0);
                
                if (totalActualizados > 0) {
                    actualizados.push(...tramosIds);
                } else {
                    // Si no se actualizó ninguno, verificar si los tramos existen
                    const tramosExistentes = await Tramo.find({ _id: { $in: tramosIds } }).select('_id');
                    const idsExistentes = new Set(tramosExistentes.map(t => t._id.toString()));
                    
                    // Agregar a conflictos los que no existen
                    for (const tramoId of tramosIds) {
                        if (!idsExistentes.has(tramoId.toString())) {
                            conflictos.push({ id: tramoId, error: 'Tramo no encontrado' });
                        }
                    }
                }
            } catch (error) {
                logger.error('Error en actualización masiva de vigencia:', error);
                conflictos.push({
                    fase: 'actualizacionMasiva',
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            actualizados,
            conflictos,
            mensaje: `Se actualizaron ${actualizados.length} tramos. ${conflictos.length} tramos presentaron conflictos.`
        });

    } catch (error) {
        logger.error('Error en actualización masiva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la vigencia de los tramos',
            error: error.message
        });
    }
};

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
exports.calcularTarifa = async (req, res) => {
    try {
        const { 
            cliente: clienteNombre, 
            origen, 
            destino, 
            fecha, 
            palets, 
            tipoUnidad, 
            tipoTramo, 
            permitirTramoNoVigente,
            tramoId
        } = req.body;

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
            tramo = await Tramo.findOne({
                _id: tramoId,
                cliente: clienteNombre,
                origen,
                destino
            }).populate('origen destino');
        } else {
            // Buscar tramo base (sin considerar tarifas históricas)
            logger.debug('Buscando tramo base para fecha:', fecha);
            tramo = await Tramo.findOne({
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

        // Buscar la tarifa histórica vigente para la fecha y tipo especificados
        const tarifaVigente = tramo.getTarifaVigente(fechaConsulta, tipoTramo);
        
        if (!tarifaVigente && !permitirTramoNoVigente) {
            return res.status(404).json({
                success: false,
                message: `No se encontró una tarifa vigente de tipo ${tipoTramo} para la fecha ${fecha}`
            });
        }

        // Obtenemos la información del cliente para sus fórmulas personalizadas
        const cliente = await Cliente.findOne({ Cliente: clienteNombre });
        const numPalets = Number(palets) || 1;
        const tipoDeUnidad = tipoUnidad || 'Sider'; // Valor por defecto: Sider

        // Preparar los datos para el cálculo
        const tramoConTarifa = {
            ...tramo.toObject(),
            valor: tarifaVigente ? tarifaVigente.valor : tramo.valor,
            valorPeaje: tarifaVigente ? tarifaVigente.valorPeaje : tramo.valorPeaje,
            metodoCalculo: tarifaVigente ? tarifaVigente.metodoCalculo : tramo.metodoCalculo,
            tipo: tarifaVigente ? tarifaVigente.tipo : tipoTramo
        };

        // Obtener la fórmula aplicable usando el nuevo servicio
        const clienteId = cliente ? cliente._id : null;
        if (clienteId && tramoConTarifa.metodoCalculo === 'Palet') {
            // Obtener la fecha para el cálculo (usar la fecha de la solicitud)
            const fechaDeCalculo = fechaConsulta;
            
            // Obtener la fórmula aplicable para este cliente, unidad y fecha
            const formulaAplicable = await formulaClienteService.getFormulaAplicable(
                clienteId, 
                tipoDeUnidad, 
                fechaDeCalculo
            );
            
            logger.debug(`Fórmula aplicable para cliente ${clienteNombre}, unidad ${tipoDeUnidad}, fecha ${fechaDeCalculo.toISOString()}: ${formulaAplicable}`);
            
            // Usar el servicio de tarifa con la fórmula aplicable
            const resultado = tarifaService.calcularTarifaTramo(tramoConTarifa, numPalets, tipoTramo, formulaAplicable);
            
            // Convertir los resultados a números fijos con 2 decimales
            const resultadoFinal = {
                tarifaBase: resultado.tarifaBase,
                peaje: resultado.peaje,
                total: resultado.total,
                detalles: {
                    origen: tramo.origen.Site,
                    destino: tramo.destino.Site,
                    distancia: tramo.distancia,
                    metodoCalculo: tarifaVigente ? tarifaVigente.metodoCalculo : 'No disponible',
                    tipo: tarifaVigente ? tarifaVigente.tipo : tipoTramo,
                    tipoUnidad: tipoDeUnidad,
                    valor: tarifaVigente ? tarifaVigente.valor : 0,
                    valorPeaje: tarifaVigente ? tarifaVigente.valorPeaje : 0,
                    vigenciaDesde: tarifaVigente ? tarifaVigente.vigenciaDesde : null,
                    vigenciaHasta: tarifaVigente ? tarifaVigente.vigenciaHasta : null
                },
                formula: formulaAplicable
            };
            
            res.json({
                success: true,
                data: resultadoFinal
            });
            return;
        }

        // Usar el servicio para calcular la tarifa con el método original
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
                metodoCalculo: tarifaVigente ? tarifaVigente.metodoCalculo : 'No disponible',
                tipo: tarifaVigente ? tarifaVigente.tipo : tipoTramo,
                tipoUnidad: tipoDeUnidad,
                valor: tarifaVigente ? tarifaVigente.valor : 0,
                valorPeaje: tarifaVigente ? tarifaVigente.valorPeaje : 0,
                vigenciaDesde: tarifaVigente ? tarifaVigente.vigenciaDesde : null,
                vigenciaHasta: tarifaVigente ? tarifaVigente.vigenciaHasta : null
            },
            formula: 'Estándar'
        };

        res.json({
            success: true,
            data: resultadoFinal
        });

    } catch (error) {
        logger.error('Error al calcular tarifa:', error);
        res.status(500).json({
            success: false,
            message: 'Error al calcular la tarifa',
            error: error.message
        });
    }
};

// Export the module
module.exports = exports;
