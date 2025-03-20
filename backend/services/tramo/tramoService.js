/**
 * @module services/tramo/tramoService
 * @description Servicio para la gestión de tramos y tarifas
 */

const Tramo = require('../../models/Tramo');
const Cliente = require('../../models/Cliente');
const Site = require('../../models/Site');
const { fechasSuperpuestas, generarTramoId, sonTramosIguales } = require('../../utils/tramoValidator');
const { calcularTarifaPaletConFormula } = require('../../utils/formulaParser');
const { calcularDistanciaRuta } = require('../routingService');
const logger = require('../../utils/logger');

/**
 * Obtiene los tramos activos para un cliente específico
 * @param {string} clienteId - ID del cliente
 * @param {Object} opciones - Opciones de filtrado
 * @returns {Promise<Array>} Array de tramos filtrados
 */
async function getTramosByCliente(clienteId, opciones = {}) {
    const { desde, hasta, incluirHistoricos } = opciones;
    
    logger.debug(`Buscando tramos para cliente: ${clienteId}`);
    logger.debug(`Parámetros de filtro: desde=${desde}, hasta=${hasta}, incluirHistoricos=${incluirHistoricos}`);
    
    // Obtener todos los tramos del cliente
    const todosLosTramos = await Tramo.find({ cliente: clienteId })
        .populate('origen', 'Site location')
        .populate('destino', 'Site location')
        .lean();  // Usar lean() para mejor rendimiento
    
    logger.debug(`Encontrados ${todosLosTramos.length} tramos totales para cliente ${clienteId}`);
    
    // Si se solicitan tramos históricos con filtro de fecha
    if (desde && hasta && incluirHistoricos === 'true') {
        return await obtenerTramosHistoricos(todosLosTramos, desde, hasta);
    }
    
    // Caso default: obtener tramos actuales
    return obtenerTramosActuales(todosLosTramos);
}

/**
 * Filtra tramos por fechas históricas
 * @param {Array} tramos - Lista de tramos a filtrar
 * @param {string} desde - Fecha inicial (ISO string)
 * @param {string} hasta - Fecha final (ISO string)
 * @returns {Object} Objeto con tramos filtrados y metadata
 */
async function obtenerTramosHistoricos(tramos, desde, hasta) {
    logger.debug('Procesando tramos históricos con filtro de fecha');
    
    // Convertir fechas a objetos Date para comparación
    const desdeDate = new Date(desde);
    const hastaDate = new Date(hasta);
    
    logger.debug(`Filtrando tramos por rango de fechas: ${desdeDate.toISOString().split('T')[0]} - ${hastaDate.toISOString().split('T')[0]}`);
    
    // Filtrar tramos válidos (con origen y destino)
    const tramosValidos = tramos.filter(tramo => tramo && tramo.origen && tramo.destino);
    
    // Usar reduce para construir el Map de tramos únicos en una sola pasada
    const tramosUnicos = tramosValidos.reduce((mapaTramos, tramo) => {
        // Función para verificar si una fecha se superpone con el rango solicitado
        const estaEnRango = (fechaDesde, fechaHasta) => {
            const desde = new Date(fechaDesde);
            const hasta = new Date(fechaHasta);
            return desde <= hastaDate && hasta >= desdeDate;
        };
        
        // Función para crear la clave única por origen-destino-tipo
        const crearClave = (origen, destino, tipo) => 
            `${origen.Site}-${destino.Site}-${tipo || 'TRMC'}`;
            
        // Función para actualizar el mapa con un tramo si es más reciente
        const actualizarMapa = (clave, tramoActualizado, fechaHasta) => {
            if (!mapaTramos.has(clave) || 
                fechaHasta > new Date(mapaTramos.get(clave).vigenciaHasta)) {
                mapaTramos.set(clave, tramoActualizado);
            }
            return mapaTramos;
        };
        
        // Caso 1: Tramo con tarifas históricas
        if (tramo.tarifasHistoricas?.length > 0) {
            // Filtrar tarifas que se superpongan con el rango de fechas solicitado
            const tarifasEnRango = tramo.tarifasHistoricas.filter(tarifa => 
                estaEnRango(tarifa.vigenciaDesde, tarifa.vigenciaHasta)
            );
            
            // Agrupar por tipo y obtener la más reciente para cada tipo
            const tiposTarifa = [...new Set(tarifasEnRango.map(t => t.tipo))];
            
            tiposTarifa.forEach(tipo => {
                // Obtener la tarifa más reciente de este tipo
                const tarifaMasReciente = tarifasEnRango
                    .filter(t => t.tipo === tipo)
                    .sort((a, b) => new Date(b.vigenciaHasta) - new Date(a.vigenciaHasta))[0];
                
                if (tarifaMasReciente) {
                    // Crear tramo con esta tarifa
                    const tramoConTarifa = {
                        ...tramo,
                        tipo,
                        metodoCalculo: tarifaMasReciente.metodoCalculo,
                        valor: tarifaMasReciente.valor,
                        valorPeaje: tarifaMasReciente.valorPeaje,
                        vigenciaDesde: tarifaMasReciente.vigenciaDesde,
                        vigenciaHasta: tarifaMasReciente.vigenciaHasta,
                        tarifasHistoricas: tramo.tarifasHistoricas
                    };
                    
                    const clave = crearClave(tramo.origen, tramo.destino, tipo);
                    actualizarMapa(clave, tramoConTarifa, new Date(tarifaMasReciente.vigenciaHasta));
                }
            });
        } 
        // Caso 2: Tramo con formato antiguo
        else if (tramo.vigenciaDesde && tramo.vigenciaHasta) {
            if (estaEnRango(tramo.vigenciaDesde, tramo.vigenciaHasta)) {
                const clave = crearClave(tramo.origen, tramo.destino, tramo.tipo);
                actualizarMapa(clave, tramo, new Date(tramo.vigenciaHasta));
            }
        }
        
        return mapaTramos;
    }, new Map());
    
    // Convertir el mapa a array
    const tramosHistoricos = Array.from(tramosUnicos.values());
    
    logger.debug(`Procesados ${tramosHistoricos.length} tramos históricos filtrados por fecha`);
    
    return {
        tramos: tramosHistoricos,
        metadata: {
            totalTramos: tramos.length,
            tramosHistoricos: tramosHistoricos.length
        }
    };
}

/**
 * Obtiene los tramos actuales (más recientes) para cada combinación origen-destino-tipo
 * @param {Array} tramos - Lista de tramos a procesar
 * @returns {Object} Objeto con tramos actuales y metadata
 */
function obtenerTramosActuales(tramos) {
    // Filtrar tramos válidos
    const tramosValidos = tramos.filter(tramo => {
        if (!tramo || !tramo.origen || !tramo.destino) {
            logger.error('Tramo inválido o sin origen/destino:', tramo);
            return false;
        }
        return true;
    });
    
    // Función para crear la clave única por origen-destino-tipo
    const crearClave = (origen, destino, tipo) => 
        `${origen.Site}-${destino.Site}-${tipo || 'TRMC'}`;
        
    // Usar reduce para construir el Map de tramos únicos en una sola pasada
    const tramosUnicos = tramosValidos.reduce((mapaTramos, tramo) => {
        // Caso 1: Tramo con tarifas históricas (modelo nuevo)
        if (tramo.tarifasHistoricas?.length > 0) {
            // Por cada tarifa histórica, crear un tramo con esos datos
            tramo.tarifasHistoricas.forEach(tarifa => {
                const tramoConTarifa = {
                    ...tramo,
                    tipo: tarifa.tipo || 'TRMC',
                    metodoCalculo: tarifa.metodoCalculo,
                    valor: tarifa.valor,
                    valorPeaje: tarifa.valorPeaje,
                    vigenciaDesde: tarifa.vigenciaDesde,
                    vigenciaHasta: tarifa.vigenciaHasta,
                    tarifasHistoricas: tramo.tarifasHistoricas
                };
                
                const clave = crearClave(tramo.origen, tramo.destino, tarifa.tipo);
                const vigenciaHasta = new Date(tarifa.vigenciaHasta);
                
                // Actualizar si no existe o si es más reciente
                if (!mapaTramos.has(clave) || 
                    vigenciaHasta > new Date(mapaTramos.get(clave).vigenciaHasta)) {
                    mapaTramos.set(clave, tramoConTarifa);
                    logger.debug(`Actualizado tramo para ${clave} con vigencia hasta ${vigenciaHasta.toISOString()}`);
                }
            });
        } 
        // Caso 2: Tramo con formato antiguo
        else if (tramo.tipo) {
            const clave = crearClave(tramo.origen, tramo.destino, tramo.tipo);
            const vigenciaHasta = new Date(tramo.vigenciaHasta);
            
            // Actualizar si no existe o si es más reciente
            if (!mapaTramos.has(clave) || 
                vigenciaHasta > new Date(mapaTramos.get(clave).vigenciaHasta)) {
                mapaTramos.set(clave, tramo);
                logger.debug(`Actualizado tramo para ${clave} con vigencia hasta ${vigenciaHasta.toISOString()}`);
            }
        }
        
        return mapaTramos;
    }, new Map());
    
    // Convertir el mapa a array
    const tramosArray = Array.from(tramosUnicos.values());
    
    // Ordenar por origen, destino y tipo
    const resultado = tramosArray.sort((a, b) => {
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
    
    logger.debug(`Procesados ${resultado.length} tramos únicos de ${tramos.length} totales`);
    
    return {
        tramos: resultado,
        metadata: {
            totalTramos: tramos.length,
            tramosUnicos: resultado.length,
            combinacionesUnicas: tramosUnicos.size
        }
    };
}

/**
 * Obtiene todas las distancias calculadas de tramos existentes
 * @returns {Promise<Array>} Lista de distancias calculadas
 */
async function getDistanciasCalculadas() {
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
    return distancias;
}

module.exports = {
    getTramosByCliente,
    getDistanciasCalculadas,
}; 