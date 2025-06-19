import { Types } from 'mongoose';
import Tramo from '../models/Tramo';
import Cliente from '../models/Cliente';
import { fechasSuperpuestas, generarTramoId } from '../utils/tramoValidator';
import logger from '../utils/logger';
import * as tarifaService from '../services/tarifaService';
import * as formulaClienteService from '../services/formulaClienteService';
import * as tramoService from '../services/tramo/tramoService';
import util from 'util';
const streamPipeline = util.promisify(require('stream').pipeline);
/**
 * Obtiene todos los tramos asociados a un cliente específico
 */
export const getTramosByCliente = async (req, res) => {
    try {
        logger.debug('Buscando tramos para cliente:', req.params.cliente);
        const { cliente } = req.params;
        const { desde, hasta, incluirHistoricos } = req.query;
        // Parámetros de paginación
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        logger.debug(`Parámetros de filtro: desde=${desde}, hasta=${hasta}, incluirHistoricos=${incluirHistoricos}, page=${page}, limit=${limit}`);
        // Construir el pipeline de agregación
        const pipeline = [];
        // Etapa 1: Filtrado inicial por cliente
        pipeline.push({ $match: { cliente: new Types.ObjectId(cliente) } });
        // Etapa 1.5: Lookup para enriquecer datos del cliente
        pipeline.push({
            $lookup: {
                from: 'clientes',
                localField: 'cliente',
                foreignField: '_id',
                as: 'clienteData'
            }
        }, {
            $addFields: {
                cliente: { $arrayElemAt: ['$clienteData', 0] }
            }
        }, {
            $project: {
                clienteData: 0
            }
        });
        // Etapa 2: Lookup para enriquecer datos de origen y destino
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
        }, {
            $addFields: {
                origen: { $arrayElemAt: ['$origenData', 0] },
                destino: { $arrayElemAt: ['$destinoData', 0] }
            }
        }, {
            $project: {
                origenData: 0,
                destinoData: 0
            }
        });
        // Si se solicitan tramos históricos con filtro de fecha
        if (desde && hasta && incluirHistoricos === 'true') {
            logger.debug('Procesando tramos históricos con filtro de fecha');
            const desdeDate = new Date(desde);
            const hastaDate = new Date(hasta);
            logger.debug(`Filtrando tramos por rango de fechas: ${desdeDate.toISOString().split('T')[0]} - ${hastaDate.toISOString().split('T')[0]}`);
            pipeline.push({
                $facet: {
                    tramosConHistorico: [
                        { $match: { tarifasHistoricas: { $exists: true, $ne: [] } } },
                        { $unwind: '$tarifasHistoricas' },
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
                    tramosAntiguos: [
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
            }, {
                $project: {
                    combinedResults: { $concatArrays: ['$tramosConHistorico', '$tramosAntiguos'] }
                }
            }, { $unwind: '$combinedResults' }, { $replaceRoot: { newRoot: '$combinedResults' } });
        }
        else {
            pipeline.push({
                $facet: {
                    tramosConHistorico: [
                        { $match: { tarifasHistoricas: { $exists: true, $ne: [] } } },
                        { $unwind: '$tarifasHistoricas' },
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
            }, {
                $project: {
                    combinedResults: { $concatArrays: ['$tramosConHistorico', '$tramosAntiguos'] }
                }
            }, { $unwind: '$combinedResults' }, { $replaceRoot: { newRoot: '$combinedResults' } });
        }
        // Etapa 4: Ordenamiento final
        pipeline.push({
            $sort: {
                'origen.Site': 1,
                'destino.Site': 1,
                tipo: 1
            }
        });
        // Etapa 5: Paginación
        pipeline.push({
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [{ $skip: skip }, { $limit: limit }]
            }
        });
        // Ejecutar la agregación
        const [result] = await Tramo.aggregate(pipeline);
        const totalTramos = result.metadata[0]?.total || 0;
        const tramos = result.data;
        logger.debug(`Encontrados ${totalTramos} tramos totales para cliente ${cliente}`);
        logger.debug(`Enviando ${tramos.length} tramos (página ${page})`);
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
};
export const getDistanciasCalculadas = async (req, res) => {
    try {
        const distancias = await Tramo.aggregate([
            { $match: { distancia: { $gt: 0 } } },
            {
                $group: {
                    _id: { origen: "$origen", destino: "$destino" },
                    distancia: { $first: "$distancia" },
                    updatedAt: { $max: "$updatedAt" }
                }
            },
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
};
/**
 * Crea múltiples tramos en una sola operación
 */
export const bulkCreateTramos = async (req, res) => {
    try {
        const { cliente, tramos, reutilizarDistancias = true, actualizarExistentes = false } = req.body;
        if (!cliente || !tramos || !Array.isArray(tramos)) {
            res.status(400).json({
                success: false,
                message: 'Se requiere cliente y un array de tramos'
            });
            return;
        }
        logger.debug(`Procesando ${tramos.length} tramos para cliente ${cliente}`);
        logger.debug(`Opciones: reutilizarDistancias=${reutilizarDistancias}, actualizarExistentes=${actualizarExistentes}`);
        const BATCH_SIZE = 50;
        const batches = [];
        for (let i = 0; i < tramos.length; i += BATCH_SIZE) {
            batches.push(tramos.slice(i, i + BATCH_SIZE));
        }
        logger.debug(`Dividiendo ${tramos.length} tramos en ${batches.length} lotes de máximo ${BATCH_SIZE} tramos`);
        const resultadosConsolidados = {
            total: tramos.length,
            exitosos: 0,
            errores: [],
            tramosCreados: 0,
            tramosActualizados: 0
        };
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            try {
                logger.debug(`Procesando lote ${i + 1} de ${batches.length} (${batch.length} tramos)`);
                const resultados = await tramoService.bulkImportTramos(cliente, batch, reutilizarDistancias, actualizarExistentes);
                resultadosConsolidados.exitosos += resultados.exitosos;
                resultadosConsolidados.tramosCreados += resultados.tramosCreados;
                resultadosConsolidados.tramosActualizados += resultados.tramosActualizados;
                const erroresConLote = resultados.errores.map(error => ({
                    ...error,
                    lote: i + 1
                }));
                resultadosConsolidados.errores.push(...erroresConLote);
                logger.debug(`Lote ${i + 1} procesado: ${resultados.exitosos} exitosos, ${resultados.errores.length} errores`);
            }
            catch (error) {
                logger.error(`Error procesando lote ${i + 1}:`, error);
                resultadosConsolidados.errores.push({
                    lote: i + 1,
                    error: `Error procesando lote: ${error.message}`
                });
            }
        }
        logger.info(`Importación masiva completada para cliente ${cliente}: ${resultadosConsolidados.exitosos} exitosos, ${resultadosConsolidados.errores.length} errores.`);
        res.status(200).json({
            success: true,
            message: `Proceso completado: ${resultadosConsolidados.exitosos} exitosos, ${resultadosConsolidados.errores.length} errores.`,
            data: resultadosConsolidados
        });
    }
    catch (error) {
        logger.error('Error general en bulkCreateTramos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor durante la importación masiva',
            error: error.message
        });
    }
};
export const getVigentesByFecha = async (req, res) => {
    try {
        const { fecha } = req.params;
        const fechaBusqueda = new Date(fecha);
        if (isNaN(fechaBusqueda.getTime())) {
            res.status(400).json({
                success: false,
                message: 'Formato de fecha inválido'
            });
            return;
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
    }
    catch (error) {
        logger.error('Error al obtener tramos vigentes:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
export const getTramoById = async (req, res) => {
    try {
        const { id } = req.params;
        const tramo = await Tramo.findById(id)
            .populate('origen', 'Site location')
            .populate('destino', 'Site location');
        if (!tramo) {
            res.status(404).json({
                success: false,
                message: 'Tramo no encontrado'
            });
            return;
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
};
export const getAllTramos = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const totalTramos = await Tramo.countDocuments();
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
    }
    catch (error) {
        logger.error('Error al obtener todos los tramos:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
export const createTramo = async (req, res) => {
    try {
        const tramoData = req.body;
        const nuevoTramo = new Tramo(tramoData);
        const tramoGuardado = await nuevoTramo.save();
        await tramoGuardado.populate('origen', 'Site');
        await tramoGuardado.populate('destino', 'Site');
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
};
export const updateTramo = async (req, res) => {
    try {
        const { id } = req.params;
        const tramoActualizado = await Tramo.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
            .populate('origen', 'Site')
            .populate('destino', 'Site');
        if (!tramoActualizado) {
            res.status(404).json({
                success: false,
                message: 'Tramo no encontrado'
            });
            return;
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
};
export const deleteTramo = async (req, res) => {
    try {
        const { id } = req.params;
        const tramoEliminado = await Tramo.findByIdAndDelete(id);
        if (!tramoEliminado) {
            res.status(404).json({
                success: false,
                message: 'Tramo no encontrado'
            });
            return;
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
};
export const verificarPosiblesDuplicados = async (req, res) => {
    try {
        const { tramos, cliente } = req.body;
        if (!Array.isArray(tramos) || !cliente) {
            res.status(400).json({
                success: false,
                message: 'Se requieren tramos y cliente'
            });
            return;
        }
        const tramosExistentes = await Tramo.find({ cliente }).lean();
        const mapaExistentes = {};
        tramosExistentes.forEach(tramo => {
            const id = generarTramoId(tramo);
            if (!mapaExistentes[id]) {
                mapaExistentes[id] = [];
            }
            mapaExistentes[id].push(tramo);
        });
        const resultado = {
            tramosVerificados: tramos.length,
            tramosExistentes: tramosExistentes.length,
            posiblesDuplicados: [],
            mapaIds: {}
        };
        for (const tramoData of tramos) {
            const id = generarTramoId(tramoData);
            if (!resultado.mapaIds[id]) {
                resultado.mapaIds[id] = 0;
            }
            resultado.mapaIds[id]++;
            const tramosConMismoId = mapaExistentes[id] || [];
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
            data: { resultado }
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
};
export const normalizarTramos = async (req, res) => {
    try {
        const resultados = {
            procesados: 0,
            actualizados: 0,
            errores: []
        };
        resultados.procesados = await Tramo.countDocuments();
        try {
            const resultTRMC = await Tramo.updateMany({ 'tarifasHistoricas.tipo': { $regex: /^trmc$/i, $ne: 'TRMC' } }, { $set: { 'tarifasHistoricas.$[elem].tipo': 'TRMC' } }, { arrayFilters: [{ 'elem.tipo': { $regex: /^trmc$/i } }], multi: true });
            const resultTRMI = await Tramo.updateMany({ 'tarifasHistoricas.tipo': { $regex: /^trmi$/i, $ne: 'TRMI' } }, { $set: { 'tarifasHistoricas.$[elem].tipo': 'TRMI' } }, { arrayFilters: [{ 'elem.tipo': { $regex: /^trmi$/i } }], multi: true });
            const resultNonValid = await Tramo.updateMany({ 'tarifasHistoricas.tipo': { $nin: ['TRMC', 'TRMI', 'trmc', 'trmi'] } }, { $set: { 'tarifasHistoricas.$[elem].tipo': 'TRMC' } }, { arrayFilters: [{ 'elem.tipo': { $nin: ['TRMC', 'TRMI', 'trmc', 'trmi'] } }], multi: true });
            const resultOldModel = await Tramo.updateMany({ tipo: { $exists: true } }, [
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
            data: resultados
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
};
export const testImportacionTipos = async (req, res) => {
    try {
        const { origen, destino, cliente } = req.body;
        if (!origen || !destino || !cliente) {
            res.status(400).json({
                success: false,
                message: 'Se requieren origen, destino y cliente para la prueba'
            });
            return;
        }
        const fechaInicio = new Date();
        const fechaFin = new Date();
        fechaFin.setFullYear(fechaFin.getFullYear() + 1);
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
        await nuevoTramo.save();
        res.json({
            success: true,
            message: 'Prueba completada correctamente',
            data: nuevoTramo
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
};
export const updateVigenciaMasiva = async (req, res) => {
    try {
        const tramosIds = req.body.tramoIds;
        const vigenciaDesde = req.body.vigenciaDesde;
        const vigenciaHasta = req.body.vigenciaHasta;
        const tipoTramo = req.body.tipoTramo;
        if (!tramosIds || !Array.isArray(tramosIds) || tramosIds.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Se requiere un array de IDs de tramos'
            });
            return;
        }
        if (!vigenciaDesde || !vigenciaHasta) {
            res.status(400).json({
                success: false,
                message: 'Se requieren las fechas de vigencia'
            });
            return;
        }
        const fechaDesde = new Date(vigenciaDesde);
        fechaDesde.setUTCHours(12, 0, 0, 0);
        const fechaHasta = new Date(vigenciaHasta);
        fechaHasta.setUTCHours(12, 0, 0, 0);
        if (fechaHasta < fechaDesde) {
            res.status(400).json({
                success: false,
                message: 'La fecha de fin debe ser posterior a la fecha de inicio'
            });
            return;
        }
        const actualizados = [];
        const conflictos = [];
        const noEncontrados = [];
        for (const tramoId of tramosIds) {
            try {
                const tramo = await Tramo.findById(tramoId);
                if (!tramo) {
                    noEncontrados.push(tramoId);
                    logger.warn(`Tramo con ID ${tramoId} no encontrado para actualización masiva.`);
                    continue;
                }
                let tarifasModificadas = false;
                for (let i = 0; i < tramo.tarifasHistoricas.length; i++) {
                    const tarifa = tramo.tarifasHistoricas[i];
                    if (tipoTramo && tarifa.tipo !== tipoTramo) {
                        continue;
                    }
                    const hayConflicto = tramo.tarifasHistoricas.some((otraTarifa, j) => i !== j &&
                        otraTarifa.tipo === tarifa.tipo &&
                        otraTarifa.metodoCalculo === tarifa.metodoCalculo &&
                        otraTarifa.vigenciaDesde <= fechaHasta &&
                        otraTarifa.vigenciaHasta >= fechaDesde);
                    if (hayConflicto) {
                        const errorMsg = `Conflicto potencial de fechas al actualizar tarifa (${tarifa.tipo}/${tarifa.metodoCalculo}) en tramo ${tramoId}.`;
                        logger.error(errorMsg);
                        conflictos.push({ id: tramoId, tarifaId: tarifa._id?.toString(), error: errorMsg });
                    }
                    else {
                        tramo.tarifasHistoricas[i].vigenciaDesde = fechaDesde;
                        tramo.tarifasHistoricas[i].vigenciaHasta = fechaHasta;
                        tarifasModificadas = true;
                    }
                }
                if (tarifasModificadas) {
                    try {
                        await tramo.save();
                        actualizados.push(tramoId);
                        logger.debug(`Tramo ${tramoId} actualizado correctamente.`);
                    }
                    catch (saveError) {
                        logger.error(`Error al guardar tramo ${tramoId} tras actualización masiva: ${saveError.message}`);
                        conflictos.push({ id: tramoId, error: `Error al guardar: ${saveError.message}` });
                    }
                }
                else if (conflictos.some(c => c.id === tramoId)) {
                    logger.warn(`Tramo ${tramoId} no actualizado debido a conflictos de fechas detectados.`);
                }
                else {
                    logger.info(`Tramo ${tramoId}: No se encontraron tarifas ${tipoTramo ? `del tipo ${tipoTramo} ` : ''}para actualizar.`);
                }
            }
            catch (error) {
                logger.error(`Error procesando tramo ${tramoId} en actualización masiva:`, error);
                conflictos.push({ id: tramoId, error: error.message });
            }
        }
        const resultado = {
            actualizados,
            conflictos,
            noEncontrados,
            mensaje: `Proceso completado: ${actualizados.length} tramos actualizados, ${conflictos.length} conflictos, ${noEncontrados.length} no encontrados.`
        };
        res.json({
            success: true,
            data: resultado
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
};
/**
 * Calcula la tarifa para un tramo específico
 */
export const calcularTarifa = async (req, res) => {
    try {
        const { cliente: clienteNombre, origen, destino, fecha, palets, tipoUnidad, tipoTramo, metodoCalculo, permitirTramoNoVigente, tramoId, tarifaHistoricaId } = req.body;
        if (!clienteNombre || !origen || !destino || !fecha || !tipoTramo) {
            res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
            return;
        }
        let tramo;
        const fechaConsulta = new Date(fecha);
        if (tramoId && permitirTramoNoVigente === true) {
            logger.debug('Buscando tramo específico por ID:', tramoId, 'con permitirTramoNoVigente:', permitirTramoNoVigente);
            tramo = await Tramo.findOne({
                _id: tramoId,
                cliente: clienteNombre,
                origen,
                destino
            }).populate('origen destino');
        }
        else {
            logger.debug('Buscando tramo base para fecha:', fecha);
            tramo = await Tramo.findOne({
                cliente: clienteNombre,
                origen,
                destino
            }).populate('origen destino');
        }
        if (!tramo) {
            res.status(404).json({
                success: false,
                message: 'No se encontró un tramo para la ruta especificada'
            });
            return;
        }
        let tarifaSeleccionada;
        if (tarifaHistoricaId && tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
            logger.debug(`Buscando tarifa histórica específica por ID: ${tarifaHistoricaId}`);
            tarifaSeleccionada = tramo.tarifasHistoricas.find(t => t._id?.toString() === tarifaHistoricaId.toString());
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
        if (!tarifaSeleccionada) {
            const tarifaVigente = tramo.getTarifaVigente(fechaConsulta, tipoTramo);
            if (!tarifaVigente && !permitirTramoNoVigente) {
                res.status(404).json({
                    success: false,
                    message: `No se encontró una tarifa vigente de tipo ${tipoTramo} para la fecha ${fecha}`
                });
                return;
            }
            tarifaSeleccionada = tarifaVigente;
            if (metodoCalculo && tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
                logger.debug(`Buscando tarifa con método de cálculo: ${metodoCalculo} y tipo: ${tipoTramo}`);
                const tarifaEspecifica = tramo.tarifasHistoricas.find(t => t.tipo === tipoTramo &&
                    t.metodoCalculo === metodoCalculo &&
                    new Date(t.vigenciaDesde) <= fechaConsulta &&
                    new Date(t.vigenciaHasta) >= fechaConsulta);
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
        const cliente = await Cliente.findOne({ Cliente: clienteNombre });
        const numPalets = Number(palets) || 1;
        const tipoDeUnidad = tipoUnidad || 'Sider';
        const tramoConTarifa = {
            ...tramo.toObject(),
            valor: tarifaSeleccionada ? tarifaSeleccionada.valor : 0,
            valorPeaje: tarifaSeleccionada ? tarifaSeleccionada.valorPeaje : 0,
            metodoCalculo: metodoCalculo || (tarifaSeleccionada ? tarifaSeleccionada.metodoCalculo : 'No disponible'),
            tipo: tarifaSeleccionada ? tarifaSeleccionada.tipo : tipoTramo
        };
        if (tarifaSeleccionada) {
            logger.debug(`Aplicando valores exactos de la tarifa seleccionada (ID: ${tarifaSeleccionada._id}): valor=${tarifaSeleccionada.valor}, peaje=${tarifaSeleccionada.valorPeaje}`);
            tramoConTarifa.valor = tarifaSeleccionada.valor;
            tramoConTarifa.valorPeaje = tarifaSeleccionada.valorPeaje;
            tramoConTarifa.metodoCalculo = tarifaSeleccionada.metodoCalculo || tramoConTarifa.metodoCalculo;
        }
        logger.debug(`Datos de cálculo: método=${tramoConTarifa.metodoCalculo}, valor=${tramoConTarifa.valor}, peaje=${tramoConTarifa.valorPeaje}`);
        const clienteId = cliente ? cliente._id?.toString() : null;
        if (clienteId && tramoConTarifa.metodoCalculo === 'Palet') {
            try {
                let fechaDeCalculo;
                if (tarifaSeleccionada && tarifaSeleccionada.vigenciaDesde) {
                    fechaDeCalculo = new Date(tarifaSeleccionada.vigenciaDesde);
                    logger.debug(`Usando fecha de vigencia de tarifa: ${fechaDeCalculo.toISOString()}`);
                }
                else if (fechaConsulta) {
                    fechaDeCalculo = fechaConsulta;
                    logger.debug(`Usando fecha de consulta: ${fechaDeCalculo.toISOString()}`);
                }
                else {
                    fechaDeCalculo = new Date();
                    logger.debug(`Usando fecha actual: ${fechaDeCalculo.toISOString()}`);
                }
                logger.debug(`Información de tarifa seleccionada:
                    ID: ${tarifaSeleccionada?._id}
                    Tipo: ${tarifaSeleccionada?.tipo}
                    Método: ${tarifaSeleccionada?.metodoCalculo}
                    Valor: ${tarifaSeleccionada?.valor}
                    Vigencia: ${new Date(tarifaSeleccionada?.vigenciaDesde || 0).toISOString()} - ${new Date(tarifaSeleccionada?.vigenciaHasta || 0).toISOString()}`);
                try {
                    const formulaAplicable = clienteId ? await formulaClienteService.getFormulaAplicable(clienteId, tipoDeUnidad, fechaDeCalculo) : null;
                    logger.debug(`Fórmula aplicable para cliente ${clienteNombre}, unidad ${tipoDeUnidad}, fecha ${fechaDeCalculo.toISOString()}: ${formulaAplicable}`);
                    let formulaAplicableCorregida = formulaAplicable;
                    if (!formulaAplicableCorregida) {
                        logger.warn(`No se encontró una fórmula personalizada específica, usando fórmula estándar`);
                        formulaAplicableCorregida = formulaClienteService.FORMULA_ESTANDAR;
                    }
                    if (!tramoConTarifa.valor || tramoConTarifa.valor === 0) {
                        if (tarifaSeleccionada && tarifaSeleccionada.valor) {
                            tramoConTarifa.valor = tarifaSeleccionada.valor;
                            logger.debug(`Actualizando valor de tarifa a: ${tramoConTarifa.valor}`);
                        }
                    }
                    const tramoParaCalculo = {
                        _id: tramo._id?.toString(),
                        valor: tramoConTarifa.valor,
                        valorPeaje: tramoConTarifa.valorPeaje,
                        metodoCalculo: tramoConTarifa.metodoCalculo,
                        distancia: tramo.distancia,
                        tarifasHistoricas: tramo.tarifasHistoricas
                    };
                    const resultado = tarifaService.calcularTarifaTramo(tramoParaCalculo, numPalets, tipoTramo, formulaAplicableCorregida);
                    logger.debug(`Resultado del cálculo:
                        tarifaBase: ${resultado.tarifaBase}
                        peaje: ${resultado.peaje}
                        total: ${resultado.total}`);
                    if (isNaN(resultado.total)) {
                        logger.warn('El cálculo resultó en NaN, corrigiendo...');
                        resultado.total = resultado.tarifaBase + resultado.peaje;
                        logger.debug(`Total corregido: ${resultado.total}`);
                    }
                    if (resultado.total === 0) {
                        logger.warn(`El cálculo con fórmula resultó en 0, intentando con método estándar`);
                        const tramoEstandar = {
                            _id: tramo._id?.toString(),
                            valor: tramoConTarifa.valor,
                            valorPeaje: tramoConTarifa.valorPeaje,
                            metodoCalculo: 'Palet',
                            distancia: tramo.distancia,
                            tarifasHistoricas: tramo.tarifasHistoricas
                        };
                        const resultadoEstandar = tarifaService.calcularTarifaTramo(tramoEstandar, numPalets, tipoTramo);
                        if (resultadoEstandar.total > 0) {
                            logger.debug(`Usando resultado de cálculo estándar: ${resultadoEstandar.total}`);
                            resultado.tarifaBase = resultadoEstandar.tarifaBase;
                            resultado.peaje = resultadoEstandar.peaje;
                            resultado.total = resultadoEstandar.total;
                        }
                    }
                    if (isNaN(resultado.total)) {
                        logger.warn('El total sigue siendo NaN, usando cálculo básico');
                        resultado.tarifaBase = tramoConTarifa.valor * numPalets;
                        resultado.total = resultado.tarifaBase + resultado.peaje;
                    }
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
                            vigenciaDesde: tarifaSeleccionada ? tarifaSeleccionada.vigenciaDesde : undefined,
                            vigenciaHasta: tarifaSeleccionada ? tarifaSeleccionada.vigenciaHasta : undefined
                        },
                        formula: formulaAplicableCorregida,
                        tarifaHistoricaId: tarifaSeleccionada ? tarifaSeleccionada._id?.toString() : undefined
                    };
                    res.json({
                        success: true,
                        data: resultadoFinal
                    });
                    return;
                }
                catch (error) {
                    logger.error(`Error al calcular tarifa con fórmula personalizada: ${error.message}`, error);
                    if (!tramoConTarifa.valor || tramoConTarifa.valor === 0) {
                        if (tarifaSeleccionada && tarifaSeleccionada.valor) {
                            tramoConTarifa.valor = tarifaSeleccionada.valor;
                            logger.debug(`Usando valor de tarifa seleccionada: ${tramoConTarifa.valor}`);
                        }
                    }
                    logger.debug(`Realizando cálculo estándar con método: ${tramoConTarifa.metodoCalculo}`);
                    const tramoParaCalculo = {
                        _id: tramo._id?.toString(),
                        valor: tramoConTarifa.valor,
                        valorPeaje: tramoConTarifa.valorPeaje,
                        metodoCalculo: tramoConTarifa.metodoCalculo,
                        distancia: tramo.distancia,
                        tarifasHistoricas: tramo.tarifasHistoricas
                    };
                    const resultado = tarifaService.calcularTarifaTramo(tramoParaCalculo, numPalets, tipoTramo);
                    logger.debug(`Resultado del cálculo estándar:
                        tarifaBase: ${resultado.tarifaBase}
                        peaje: ${resultado.peaje}
                        total: ${resultado.total}`);
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
                            vigenciaDesde: tarifaSeleccionada ? tarifaSeleccionada.vigenciaDesde : undefined,
                            vigenciaHasta: tarifaSeleccionada ? tarifaSeleccionada.vigenciaHasta : undefined
                        },
                        formula: 'Estándar',
                        tarifaHistoricaId: tarifaSeleccionada ? tarifaSeleccionada._id?.toString() : undefined
                    };
                    res.json({
                        success: true,
                        data: resultadoFinal
                    });
                }
            }
            catch (error) {
                logger.error(`Error al calcular tarifa con fórmula personalizada: ${error.message}`, error);
                if (!tramoConTarifa.valor || tramoConTarifa.valor === 0) {
                    if (tarifaSeleccionada && tarifaSeleccionada.valor) {
                        tramoConTarifa.valor = tarifaSeleccionada.valor;
                        logger.debug(`Usando valor de tarifa seleccionada: ${tramoConTarifa.valor}`);
                    }
                }
                logger.debug(`Realizando cálculo estándar con método: ${tramoConTarifa.metodoCalculo}`);
                const tramoParaCalculo = {
                    _id: tramo._id?.toString(),
                    valor: tramoConTarifa.valor,
                    valorPeaje: tramoConTarifa.valorPeaje,
                    metodoCalculo: tramoConTarifa.metodoCalculo,
                    distancia: tramo.distancia,
                    tarifasHistoricas: tramo.tarifasHistoricas
                };
                const resultado = tarifaService.calcularTarifaTramo(tramoParaCalculo, numPalets, tipoTramo);
                logger.debug(`Resultado del cálculo estándar:
                    tarifaBase: ${resultado.tarifaBase}
                    peaje: ${resultado.peaje}
                    total: ${resultado.total}`);
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
                        vigenciaDesde: tarifaSeleccionada ? tarifaSeleccionada.vigenciaDesde : undefined,
                        vigenciaHasta: tarifaSeleccionada ? tarifaSeleccionada.vigenciaHasta : undefined
                    },
                    formula: 'Estándar',
                    tarifaHistoricaId: tarifaSeleccionada ? tarifaSeleccionada._id?.toString() : undefined
                };
                res.json({
                    success: true,
                    data: resultadoFinal
                });
            }
        }
        logger.debug(`Realizando cálculo estándar final con valores directos de tarifa: valor=${tramoConTarifa.valor}, peaje=${tramoConTarifa.valorPeaje}, método=${tramoConTarifa.metodoCalculo}`);
        const tramoParaCalculo = {
            _id: tramo._id?.toString(),
            valor: tramoConTarifa.valor,
            valorPeaje: tramoConTarifa.valorPeaje,
            metodoCalculo: tramoConTarifa.metodoCalculo,
            distancia: tramo.distancia,
            tarifasHistoricas: tramo.tarifasHistoricas
        };
        const resultado = tarifaService.calcularTarifaTramo(tramoParaCalculo, numPalets, tipoTramo);
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
                vigenciaDesde: tarifaSeleccionada ? tarifaSeleccionada.vigenciaDesde : undefined,
                vigenciaHasta: tarifaSeleccionada ? tarifaSeleccionada.vigenciaHasta : undefined
            },
            formula: 'Estándar',
            tarifaHistoricaId: tarifaSeleccionada ? tarifaSeleccionada._id?.toString() : undefined
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
};
//# sourceMappingURL=tramoController.js.map