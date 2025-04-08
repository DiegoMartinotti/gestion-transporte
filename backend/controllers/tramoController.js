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
        
        logger.debug(`Parámetros de filtro: desde=${desde}, hasta=${hasta}, incluirHistoricos=${incluirHistoricos}, page=${page}, limit=${limit}`);
        
        // Obtener todos los tramos del cliente
        const todosLosTramos = await Tramo.find({ cliente })
            .populate('origen', 'Site location')
            .populate('destino', 'Site location')
            .lean();  // Usar lean() para mejor rendimiento
        
        logger.debug(`Encontrados ${todosLosTramos.length} tramos totales para cliente ${cliente}`);
        
        // Si se solicitan tramos históricos con filtro de fecha
        if (desde && hasta && incluirHistoricos === 'true') {
            logger.debug('Procesando tramos históricos con filtro de fecha');
            
            // Convertir fechas a objetos Date para comparación
            const desdeDate = new Date(desde);
            const hastaDate = new Date(hasta);
            
            logger.debug(`Filtrando tramos por rango de fechas: ${desdeDate.toISOString().split('T')[0]} - ${hastaDate.toISOString().split('T')[0]}`);
            
            // Crear un mapa para almacenar solo el tramo más reciente por cada combinación
            const tramosUnicos = new Map();
            
            // Procesar cada tramo
            todosLosTramos.forEach(tramo => {
                if (!tramo || !tramo.origen || !tramo.destino) {
                    return;
                }
                
                // Verificar si el tramo tiene tarifas históricas
                if (tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
                    // Filtrar tarifas que se superpongan con el rango de fechas solicitado
                    const tarifasEnRango = tramo.tarifasHistoricas.filter(tarifa => {
                        const tarifaDesde = new Date(tarifa.vigenciaDesde);
                        const tarifaHasta = new Date(tarifa.vigenciaHasta);
                        
                        // Verificar si la tarifa se superpone con el rango de fechas
                        return tarifaDesde <= hastaDate && tarifaHasta >= desdeDate;
                    });
                    
                    // Agrupar por tipo de tarifa
                    const tiposTarifa = new Set(tarifasEnRango.map(t => t.tipo));
                    
                    // Para cada tipo de tarifa, encontrar la más reciente en el rango
                    tiposTarifa.forEach(tipo => {
                        // Filtrar tarifas por tipo
                        const tarifasDeTipo = tarifasEnRango.filter(t => t.tipo === tipo);
                        
                        // Ordenar por fecha de vigencia (más reciente primero)
                        tarifasDeTipo.sort((a, b) => 
                            new Date(b.vigenciaHasta) - new Date(a.vigenciaHasta)
                        );
                        
                        if (tarifasDeTipo.length > 0) {
                            // Crear una copia del tramo con la tarifa específica
                            const tramoConTarifa = {
                                ...tramo,
                                tipo: tipo, // Asignar el tipo de la tarifa al tramo
                                metodoCalculo: tarifasDeTipo[0].metodoCalculo,
                                valor: tarifasDeTipo[0].valor,
                                valorPeaje: tarifasDeTipo[0].valorPeaje,
                                vigenciaDesde: tarifasDeTipo[0].vigenciaDesde,
                                vigenciaHasta: tarifasDeTipo[0].vigenciaHasta,
                                // Mantener la referencia a todas las tarifas históricas
                                tarifasHistoricas: tramo.tarifasHistoricas
                            };
                            
                            // Clave única que incluye origen, destino y tipo
                            const key = `${tramo.origen.Site}-${tramo.destino.Site}-${tipo}`;
                            
                            // Guardar en el mapa
                            if (!tramosUnicos.has(key) || 
                                new Date(tarifasDeTipo[0].vigenciaHasta) > new Date(tramosUnicos.get(key).vigenciaHasta)) {
                                tramosUnicos.set(key, tramoConTarifa);
                            }
                        }
                    });
                } else if (tramo.vigenciaDesde && tramo.vigenciaHasta) {
                    // Para tramos con formato antiguo
                    const tramoDesde = new Date(tramo.vigenciaDesde);
                    const tramoHasta = new Date(tramo.vigenciaHasta);
                    
                    // Verificar si el tramo se superpone con el rango de fechas
                    if (tramoDesde <= hastaDate && tramoHasta >= desdeDate) {
                        // Clave única que incluye origen, destino y tipo
                        const key = `${tramo.origen.Site}-${tramo.destino.Site}-${tramo.tipo || 'TRMC'}`;
                        
                        // Si no existe un tramo para esta clave o este tramo tiene una fecha más reciente
                        if (!tramosUnicos.has(key) || 
                            tramoHasta > new Date(tramosUnicos.get(key).vigenciaHasta)) {
                            tramosUnicos.set(key, tramo);
                        }
                    }
                }
            });
            
            // Convertir el mapa a array
            const tramosHistoricos = Array.from(tramosUnicos.values());
            
            // Aplicar paginación en memoria
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const tramosHistoricosPaginados = tramosHistoricos.slice(startIndex, endIndex);
            
            logger.debug(`Devolviendo ${tramosHistoricosPaginados.length} tramos históricos filtrados por fecha (página ${page})`);
            
            return res.status(200).json({
                success: true,
                data: tramosHistoricosPaginados,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(tramosHistoricos.length / limit),
                    totalItems: tramosHistoricos.length,
                    limit: limit
                },
                metadata: {
                    totalTramos: todosLosTramos.length,
                    tramosHistoricos: tramosHistoricos.length
                }
            });
        }
        
        // Si no hay filtros de fecha o no se solicitan históricos, continuar con el comportamiento normal
        // Crear un mapa para almacenar solo el tramo más reciente por cada combinación
        const tramosUnicos = new Map();
        
        // Procesar cada tramo
        todosLosTramos.forEach(tramo => {
            if (!tramo || !tramo.origen || !tramo.destino) {
                logger.error('Tramo inválido o sin origen/destino:', tramo);
                return;
            }
            
            // Verificar si el tramo tiene tarifas históricas
            if (tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
                // Procesar cada tarifa histórica como un tramo separado
                tramo.tarifasHistoricas.forEach(tarifa => {
                    // Crear una copia del tramo para cada tarifa
                    const tramoConTarifa = {
                        ...tramo,
                        tipo: tarifa.tipo || 'TRMC',
                        metodoCalculo: tarifa.metodoCalculo,
                        valor: tarifa.valor,
                        valorPeaje: tarifa.valorPeaje,
                        vigenciaDesde: tarifa.vigenciaDesde,
                        vigenciaHasta: tarifa.vigenciaHasta,
                        // Mantener la referencia a todas las tarifas históricas
                        tarifasHistoricas: tramo.tarifasHistoricas
                    };
                    
                    // Crear una clave única que incluya origen, destino y tipo
                    const clave = `${tramo.origen.Site}-${tramo.destino.Site}-${tarifa.tipo || 'TRMC'}`;
                    
                    // Convertir vigenciaHasta a Date para comparación
                    const vigenciaHasta = new Date(tarifa.vigenciaHasta);
                    
                    // Si no existe un tramo para esta clave o este tramo tiene una fecha más reciente
                    if (!tramosUnicos.has(clave) || 
                        vigenciaHasta > new Date(tramosUnicos.get(clave).vigenciaHasta)) {
                        tramosUnicos.set(clave, tramoConTarifa);
                        logger.debug(`Actualizado tramo para ${clave} con vigencia hasta ${vigenciaHasta.toISOString()}`);
                    }
                });
            } else if (tramo.tipo) {
                // Para tramos con formato antiguo (sin tarifasHistoricas)
                // Crear una clave única que incluya origen, destino y tipo
                const clave = `${tramo.origen.Site}-${tramo.destino.Site}-${tramo.tipo || 'TRMC'}`;
                
                // Convertir vigenciaHasta a Date para comparación
                const vigenciaHasta = new Date(tramo.vigenciaHasta);
                
                // Si no existe un tramo para esta clave o este tramo tiene una fecha más reciente
                if (!tramosUnicos.has(clave) || 
                    vigenciaHasta > new Date(tramosUnicos.get(clave).vigenciaHasta)) {
                    tramosUnicos.set(clave, tramo);
                    logger.debug(`Actualizado tramo para ${clave} con vigencia hasta ${vigenciaHasta.toISOString()}`);
                }
            }
        });
        
        // Convertir el mapa a array y ordenar
        const resultado = Array.from(tramosUnicos.values()).sort((a, b) => {
            // Primero ordenar por origen
            const origenA = a.origen?.Site || '';
            const origenB = b.origen?.Site || '';
            if (origenA < origenB) return -1;
            if (origenA > origenB) return 1;
            
            // Si origen es igual, ordenar por destino
            const destinoA = a.destino?.Site || '';
            const destinoB = b.destino?.Site || '';
            if (destinoA < destinoB) return -1;
            if (destinoA > destinoB) return 1;
            
            // Si origen y destino son iguales, ordenar por tipo
            return (a.tipo || 'TRMC').localeCompare(b.tipo || 'TRMC');
        });
        
        // Aplicar paginación en memoria
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const resultadoPaginado = resultado.slice(startIndex, endIndex);
        
        logger.debug(`Enviando ${resultadoPaginado.length} tramos únicos de ${resultado.length} (página ${page})`);
        
        // Enviar respuesta con metadata
        res.json({
            success: true,
            data: resultadoPaginado,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(resultado.length / limit),
                totalItems: resultado.length,
                limit: limit
            },
            metadata: {
                totalTramos: todosLosTramos.length,
                tramosUnicos: resultado.length,
                combinacionesUnicas: tramosUnicos.size
            }
        });
        
    } catch (error) {
        logger.error('Error al obtener tramos:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
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

        // Encontrar todos los tramos
        const tramos = await Tramo.find();
        resultados.procesados = tramos.length;

        for (const tramo of tramos) {
            try {
                let actualizado = false;
                
                // Verificar si el tramo tiene tarifasHistoricas
                if (tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
                    // Normalizar el tipo en cada tarifa histórica
                    tramo.tarifasHistoricas.forEach(tarifa => {
                        if (tarifa.tipo) {
                            const tipoOriginal = tarifa.tipo;
                            tarifa.tipo = tarifa.tipo.toUpperCase();
                            
                            if (tipoOriginal !== tarifa.tipo) {
                                actualizado = true;
                            }
                            
                            // Asegurarse que sea uno de los tipos válidos
                            if (!['TRMC', 'TRMI'].includes(tarifa.tipo)) {
                                tarifa.tipo = 'TRMC'; // Valor por defecto
                                actualizado = true;
                            }
                        } else {
                            // Si no tiene tipo, asignar el predeterminado
                            tarifa.tipo = 'TRMC';
                            actualizado = true;
                        }
                    });
                } 
                // Compatibilidad con el modelo antiguo
                else if (tramo.tipo) {
                    const tipoOriginal = tramo.tipo;
                    tramo.tipo = tramo.tipo.toUpperCase();
                    
                    if (tipoOriginal !== tramo.tipo) {
                        actualizado = true;
                    }
                    
                    // Asegurarse que sea uno de los tipos válidos
                    if (!['TRMC', 'TRMI'].includes(tramo.tipo)) {
                        tramo.tipo = 'TRMC'; // Valor por defecto
                        actualizado = true;
                    }
                } else {
                    // Si no tiene tipo, asignar el predeterminado
                    tramo.tipo = 'TRMC';
                    actualizado = true;
                }

                if (actualizado) {
                    await tramo.save();
                    resultados.actualizados++;
                }
            } catch (error) {
                resultados.errores.push({
                    id: tramo._id,
                    error: error.message
                });
            }
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

        // Procesar cada tramo individualmente para mantener las validaciones
        for (const tramoId of tramosIds) {
            try {
                const tramo = await Tramo.findById(tramoId);
                if (!tramo) {
                    conflictos.push({ id: tramoId, error: 'Tramo no encontrado' });
                    continue;
                }

                // Verificar si el tramo tiene tarifasHistoricas
                if (tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
                    // Si se especificó un tipo de tramo, actualizar solo ese tipo
                    if (tipoTramo) {
                        const tarifaIndex = tramo.tarifasHistoricas.findIndex(
                            t => t.tipo === tipoTramo
                        );
                        
                        if (tarifaIndex === -1) {
                            conflictos.push({ 
                                id: tramoId, 
                                error: `No se encontró una tarifa con tipo ${tipoTramo}` 
                            });
                            continue;
                        }
                        
                        // Validar que no haya conflictos con otras tarifas del mismo tipo
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
                    } 
                    // Si no se especificó tipo, actualizar todas las tarifas
                    else {
                        tramo.tarifasHistoricas.forEach(tarifa => {
                            tarifa.vigenciaDesde = fechaDesde;
                            tarifa.vigenciaHasta = fechaHasta;
                        });
                    }
                    
                    await tramo.save();
                    actualizados.push(tramoId);
                }
                // Compatibilidad con el modelo antiguo
                else {
                    // Validar que no haya conflictos con otros tramos
                    const tramosConflicto = await Tramo.find({
                        _id: { $ne: tramoId },
                        origen: tramo.origen,
                        destino: tramo.destino,
                        tipo: tramo.tipo,
                        metodoCalculo: tramo.metodoCalculo,
                        cliente: tramo.cliente,
                        $or: [
                            {
                                vigenciaDesde: { $lte: fechaHasta },
                                vigenciaHasta: { $gte: fechaDesde }
                            }
                        ]
                    });

                    if (tramosConflicto.length > 0) {
                        conflictos.push({
                            id: tramoId,
                            error: 'Ya existe un tramo con las mismas características y fechas que se superponen'
                        });
                        continue;
                    }

                    // Actualizar el tramo
                    tramo.vigenciaDesde = fechaDesde;
                    tramo.vigenciaHasta = fechaHasta;
                    await tramo.save();
                    actualizados.push(tramoId);
                }
            } catch (error) {
                logger.error(`Error actualizando tramo ${tramoId}:`, error);
                conflictos.push({ id: tramoId, error: error.message });
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
 * @param {Object} req.body - Cuerpo de la solicitud
 * @param {string} req.body.cliente - Nombre del cliente
 * @param {string} req.body.origen - ID del sitio de origen
 * @param {string} req.body.destino - ID del sitio de destino
 * @param {Date} req.body.fecha - Fecha para la cual calcular la tarifa
 * @param {number} req.body.palets - Cantidad de palets
 * @param {string} req.body.tipoUnidad - Tipo de unidad (Sider/Bitren)
 * @param {string} req.body.tipoTramo - Tipo de tramo (TRMC/TRMI)
 * @param {boolean} req.body.permitirTramoNoVigente - Permitir calcular la tarifa de un tramo no vigente
 * @param {string} req.body.tramoId - ID del tramo para calcular la tarifa
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Tarifa calculada con detalles
 * @throws {Error} Error 404 si no se encuentra el tramo
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

        // Calcular tarifa según el método de cálculo
        let tarifaBase = 0;
        let peaje = tarifaVigente ? Number(tarifaVigente.valorPeaje) || 0 : 0;
        let total = 0;
        const numPalets = Number(palets) || 1;
        const tipoDeUnidad = tipoUnidad || 'Sider'; // Valor por defecto: Sider

        if (tarifaVigente) {
            switch (tarifaVigente.metodoCalculo) {
                case 'Palet':
                    // Si es tipo Palet, verificamos si el cliente tiene una fórmula personalizada para el tipo de unidad
                    if (cliente) {
                        const formulaKey = tipoDeUnidad === 'Bitren' ? 'formulaPaletBitren' : 'formulaPaletSider';
                        const formulaPersonalizada = cliente[formulaKey];
                        
                        // Si hay una fórmula personalizada, la usamos para calcular la tarifa
                        if (formulaPersonalizada) {
                            logger.debug(`Usando fórmula personalizada para ${clienteNombre} (${tipoDeUnidad}): ${formulaPersonalizada}`);
                            const resultado = calcularTarifaPaletConFormula(tarifaVigente.valor, peaje, numPalets, formulaPersonalizada);
                            tarifaBase = resultado.tarifaBase;
                            peaje = resultado.peaje;
                            total = resultado.total;
                            break;
                        }
                    }
                    // Si no hay fórmula personalizada, usa el cálculo por defecto
                    tarifaBase = tarifaVigente.valor * numPalets;
                    total = tarifaBase + peaje;
                    break;
                case 'Kilometro':
                    tarifaBase = tarifaVigente.valor * tramo.distancia;
                    total = tarifaBase + peaje;
                    break;
                case 'Fijo':
                    tarifaBase = tarifaVigente.valor;
                    total = tarifaBase + peaje;
                    break;
                default:
                    tarifaBase = 0;
                    total = peaje;
            }
        }

        // Convertir los resultados a números fijos con 2 decimales
        const resultadoFinal = {
            tarifaBase: Math.round(tarifaBase * 100) / 100,
            peaje: Math.round(peaje * 100) / 100,
            total: Math.round(total * 100) / 100,
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
            formula: cliente && tarifaVigente && tarifaVigente.metodoCalculo === 'Palet' ? 
                (tipoDeUnidad === 'Bitren' ? cliente.formulaPaletBitren : cliente.formulaPaletSider) : 'Estándar'
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
