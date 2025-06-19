/**
 * @module services/tramo/tramoService
 * @description Servicio para la gestión de tramos y tarifas
 */

import Tramo from '../../models/Tramo';
import Cliente from '../../models/Cliente';
import Site from '../../models/Site';
import { fechasSuperpuestas, generarTramoId, sonTramosIguales } from '../../utils/tramoValidator';
import { calcularTarifaPaletConFormula } from '../../utils/formulaParser';
import { calcularDistanciaRuta } from '../routingService';
import logger from '../../utils/logger';
import mongoose from 'mongoose';

interface SiteMap {
  sitesMap: Map<string, any>;
  sitesMapByCode: Map<string, any>;
}

interface TarifaHistorica {
  tipo: string;
  metodoCalculo: string;
  valor: number;
  valorPeaje: number;
  vigenciaDesde: Date;
  vigenciaHasta: Date;
}

interface TramoData {
  _id?: string;
  origen: string;
  destino: string;
  origenNombre?: string;
  destinoNombre?: string;
  tarifaHistorica: TarifaHistorica;
  distanciaPreCalculada?: number;
}

interface ProcessOptions {
  clienteId: string;
  reutilizarDistancias: boolean;
  actualizarExistentes?: boolean;
  sitesMap: Map<string, any>;
  sitesMapByCode: Map<string, any>;
  mapaTramos: Map<string, any>;
}

interface ProcessResult {
  status: 'insert' | 'update' | 'error';
  operation?: any;
  error?: string;
  tramoInfo?: {
    origenNombre: string;
    destinoNombre: string;
  };
}

interface BulkImportResult {
  total: number;
  exitosos: number;
  errores: Array<{
    tramo: number;
    origen: string;
    destino: string;
    error: string;
  }>;
  tramosCreados: number;
  tramosActualizados: number;
}

interface TramosBulkData {
  origenNombre: string;
  destinoNombre: string;
  tipoTarifa: string;
  metodoCalculo: string;
  valorTarifa: number;
  valorPeaje?: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
}

interface CreateTramosBulkResult {
  success: boolean;
  insertados: number;
  actualizados: number;
  errores: Array<{
    index?: number | string;
    message: string;
    code?: number;
    data?: any;
  }>;
}

/**
 * Construye mapas de sitios para búsqueda rápida
 * 
 * @private
 * @returns Objeto con mapas por ID y código
 */
async function _buildSiteMaps(): Promise<SiteMap> {
    // Obtener todos los sitios (esto se hace una sola vez)
    const allSites = await Site.find({}).select('_id Site codigo location').lean();
    
    // Crear mapas para búsqueda rápida
    const sitesMap = new Map();
    const sitesMapByCode = new Map();
    
    allSites.forEach(site => {
        // Mapa por ID
        sitesMap.set(String(site._id), site);
        
        // Mapa por código (si existe)
        if (site.codigo) {
            sitesMapByCode.set(site.codigo.toLowerCase(), site);
        }
    });
    
    logger.debug(`Mapas de sitios construidos con ${sitesMap.size} sitios y ${sitesMapByCode.size} códigos`);
    
    return { sitesMap, sitesMapByCode };
}

/**
 * Procesa una fila de datos de tramo para importación
 * 
 * @private
 * @param tramoData - Datos del tramo a procesar
 * @param indiceTramo - Índice del tramo (para logging)
 * @param options - Opciones de procesamiento
 * @returns Resultado del procesamiento (operación, tramo, error)
 */
async function _processTramoRow(tramoData: TramoData, indiceTramo: number, options: ProcessOptions): Promise<ProcessResult> {
    const { clienteId, reutilizarDistancias, sitesMap, sitesMapByCode, mapaTramos } = options;
    
    try {
        // Validación básica de datos
        if (!tramoData.origen) {
            return { 
                status: 'error', 
                error: 'ID de origen no especificado o inválido'
            };
        }

        if (!tramoData.destino) {
            return { 
                status: 'error', 
                error: 'ID de destino no especificado o inválido'
            };
        }
                
        // Normalizar tipo de tramo
        tramoData.tarifaHistorica.tipo = tramoData.tarifaHistorica.tipo?.toUpperCase() || 'TRMC';
        
        // Procesar fechas
        let fechaDesde = new Date(tramoData.tarifaHistorica.vigenciaDesde);
        let fechaHasta = new Date(tramoData.tarifaHistorica.vigenciaHasta);
        
        // Validar fechas
        if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
            return { 
                status: 'error', 
                error: 'Fechas de vigencia inválidas'
            };
        }
        
        // Construir la clave para buscar en el mapa
        const origenIdStr = String(tramoData.origen);
        const destinoIdStr = String(tramoData.destino);
        const tramoKey = `${origenIdStr}-${destinoIdStr}-${clienteId}`;
        const tramoExistente = mapaTramos.get(tramoKey);
        
        // Crear la nueva tarifa a partir de los datos
        const nuevaTarifa: TarifaHistorica = {
            tipo: tramoData.tarifaHistorica.tipo,
            metodoCalculo: tramoData.tarifaHistorica.metodoCalculo || 'Kilometro',
            valor: parseFloat(String(tramoData.tarifaHistorica.valor)) || 0,
            valorPeaje: parseFloat(String(tramoData.tarifaHistorica.valorPeaje)) || 0,
            vigenciaDesde: fechaDesde,
            vigenciaHasta: fechaHasta
        };
        
        // Caso 1: El tramo ya existe, debemos actualizar
        if (tramoExistente) {
            logger.debug(`Tramo #${indiceTramo}: Encontrado tramo existente para ${tramoData.origenNombre || origenIdStr} → ${tramoData.destinoNombre || destinoIdStr}`);
            
            // Verificar si la tarifa específica ya existe (duplicado exacto o conflicto de fechas)
            let tarifaDuplicadaExacta = false;
            let conflictoFechasDetectado = false;
            let errorConflicto: string | null = null;

            for (const tarifaExistente of tramoExistente.tarifasHistoricas) {
                // Verificar duplicado exacto
                if (
                    tarifaExistente.tipo === nuevaTarifa.tipo &&
                    tarifaExistente.metodoCalculo === nuevaTarifa.metodoCalculo &&
                    tarifaExistente.valor === nuevaTarifa.valor &&
                    tarifaExistente.valorPeaje === nuevaTarifa.valorPeaje &&
                    tarifaExistente.vigenciaDesde.getTime() === nuevaTarifa.vigenciaDesde.getTime() &&
                    tarifaExistente.vigenciaHasta.getTime() === nuevaTarifa.vigenciaHasta.getTime()
                ) {
                    tarifaDuplicadaExacta = true;
                    errorConflicto = `Tarifa duplicada exacta ya existe.`;
                    logger.warn(`Tramo #${indiceTramo}: ${errorConflicto}`);
                    break;
                }
                
                // Verificar conflicto de fechas (mismo tipo y método)
                if (tarifaExistente.tipo === nuevaTarifa.tipo && 
                    tarifaExistente.metodoCalculo === nuevaTarifa.metodoCalculo) {
                    
                    if (fechasSuperpuestas(
                        nuevaTarifa.vigenciaDesde, nuevaTarifa.vigenciaHasta,
                        tarifaExistente.vigenciaDesde, tarifaExistente.vigenciaHasta
                    )) {
                        conflictoFechasDetectado = true;
                        errorConflicto = `Conflicto de fechas con tarifa existente.`;
                        logger.error(`Tramo #${indiceTramo}: ${errorConflicto}`);
                        break;
                    }
                }
            }

            // No hay duplicados ni conflictos, podemos añadir la tarifa
            if (!tarifaDuplicadaExacta && !conflictoFechasDetectado) {
                // Preparar la operación para bulkWrite
                return {
                    status: 'update',
                    operation: {
                        updateOne: {
                            filter: { _id: tramoExistente._id },
                            update: { $push: { tarifasHistoricas: nuevaTarifa } }
                        }
                    },
                    tramoInfo: {
                        origenNombre: tramoData.origenNombre || origenIdStr,
                        destinoNombre: tramoData.destinoNombre || destinoIdStr
                    }
                };
            } else {
                // Hay duplicado o conflicto
                return {
                    status: 'error',
                    error: errorConflicto || 'Error desconocido',
                    tramoInfo: {
                        origenNombre: tramoData.origenNombre || origenIdStr,
                        destinoNombre: tramoData.destinoNombre || destinoIdStr
                    }
                };
            }
        } 
        // Caso 2: El tramo no existe, debemos crearlo
        else {
            logger.debug(`Tramo #${indiceTramo}: No se encontró tramo existente. Creando nuevo...`);
            
            // Buscar objetos site completos
            const origenSite = sitesMap.get(origenIdStr);
            const destinoSite = sitesMap.get(destinoIdStr);

            // Crear el nuevo documento
            const nuevoTramo = {
                _id: new mongoose.Types.ObjectId(),
                origen: tramoData.origen,
                destino: tramoData.destino,
                cliente: clienteId,
                distancia: reutilizarDistancias ? (tramoData.distanciaPreCalculada || 0) : 0,
                tarifasHistoricas: [nuevaTarifa]
            };
            
            // Si no hay distancia y tenemos coordenadas de origen y destino, calcularla
            if ((!nuevoTramo.distancia || nuevoTramo.distancia === 0) && 
                origenSite?.location?.coordinates?.length === 2 && 
                destinoSite?.location?.coordinates?.length === 2) {
                try {
                    const distanciaKm = await calcularDistanciaRuta(
                        origenSite.location.coordinates, 
                        destinoSite.location.coordinates
                    );
                    nuevoTramo.distancia = distanciaKm;
                    logger.debug(`Distancia calculada para tramo #${indiceTramo}: ${distanciaKm} km`);
                } catch (routeError) {
                    logger.error(`Error calculando distancia para tramo #${indiceTramo}:`, routeError);
                }
            }
            
            // Preparar la operación para bulkWrite
            return {
                status: 'insert',
                operation: {
                    insertOne: {
                        document: nuevoTramo
                    }
                },
                tramoInfo: {
                    origenNombre: tramoData.origenNombre || origenIdStr,
                    destinoNombre: tramoData.destinoNombre || destinoIdStr
                }
            };
        }
    } catch (error) {
        // Error en el procesamiento
        return {
            status: 'error',
            error: (error as Error).message || 'Error desconocido en procesamiento',
            tramoInfo: {
                origenNombre: tramoData.origenNombre || tramoData.origen, 
                destinoNombre: tramoData.destinoNombre || tramoData.destino
            }
        };
    }
}

/**
 * Importación masiva de tramos
 * 
 * @param clienteId - ID del cliente
 * @param tramosData - Array de objetos con datos de tramos
 * @param reutilizarDistancias - Indica si se deben reutilizar distancias pre-calculadas
 * @param actualizarExistentes - Indica si se deben actualizar tramos existentes
 * @returns Resultado de la operación con tramos creados y errores
 * @throws Error si hay problemas en la importación
 */
async function bulkImportTramos(clienteId: string, tramosData: TramoData[], reutilizarDistancias: boolean = true, actualizarExistentes: boolean = false): Promise<BulkImportResult> {
    logger.debug(`Procesando ${tramosData.length} tramos para cliente ${clienteId}`);
    logger.debug(`Opciones: reutilizarDistancias=${reutilizarDistancias}, actualizarExistentes=${actualizarExistentes}`);
    
    // Resultados
    const resultados: BulkImportResult = {
        total: tramosData.length,
        exitosos: 0,
        errores: [],
        tramosCreados: 0,
        tramosActualizados: 0
    };
    
    try {
        // Construir mapas de sitios para búsqueda rápida
        const { sitesMap, sitesMapByCode } = await _buildSiteMaps();
        
        // Cargar todos los tramos existentes para este cliente
        const tramosExistentes = await Tramo.find({ 
            cliente: clienteId 
        });
        
        logger.debug(`Se encontraron ${tramosExistentes.length} tramos existentes para el cliente ${clienteId}`);
        
        // Crear un mapa para búsqueda rápida de tramos existentes
        const mapaTramos = new Map();
        tramosExistentes.forEach(tramo => {
            const origenId = String(tramo.origen);
            const destinoId = String(tramo.destino);
            const key = `${origenId}-${destinoId}-${clienteId}`;
            if (!mapaTramos.has(key)) {
                mapaTramos.set(key, tramo);
            } else {
                logger.warn(`Se encontró un tramo duplicado en la base de datos para la clave: ${key}`);
            }
        });
        
        // Opciones de procesamiento
        const options: ProcessOptions = {
            clienteId,
            reutilizarDistancias,
            actualizarExistentes,
            sitesMap,
            sitesMapByCode,
            mapaTramos
        };
        
        // Preparar operaciones para bulkWrite
        const operacionesInsert: any[] = [];
        const operacionesUpdate: any[] = [];
        
        // Iniciar sesión de MongoDB para transacción
        const session = await mongoose.startSession();
        
        try {
            // Procesar cada tramo
            for (let i = 0; i < tramosData.length; i++) {
                const tramoData = tramosData[i];
                const indiceTramo = i + 1; // Para mensajes de error (1-indexed)
                
                // Procesar la fila de datos
                const resultado = await _processTramoRow(tramoData, indiceTramo, options);
                
                if (resultado.status === 'insert') {
                    operacionesInsert.push(resultado.operation);
                    resultados.tramosCreados++;
                    resultados.exitosos++;
                } 
                else if (resultado.status === 'update') {
                    operacionesUpdate.push(resultado.operation);
                    resultados.tramosActualizados++;
                    resultados.exitosos++;
                } 
                else if (resultado.status === 'error') {
                    resultados.errores.push({
                        tramo: indiceTramo,
                        origen: resultado.tramoInfo?.origenNombre || tramoData.origen,
                        destino: resultado.tramoInfo?.destinoNombre || tramoData.destino,
                        error: resultado.error || 'Error desconocido'
                    });
                }
            }
            
            // Iniciar transacción
            await session.withTransaction(async () => {
                // Ejecutar operaciones en lotes
                if (operacionesInsert.length > 0) {
                    await Tramo.bulkWrite(operacionesInsert, { session });
                    logger.debug(`Insertados ${operacionesInsert.length} tramos nuevos`);
                }
                
                if (operacionesUpdate.length > 0) {
                    await Tramo.bulkWrite(operacionesUpdate, { session });
                    logger.debug(`Actualizados ${operacionesUpdate.length} tramos existentes`);
                }
            });
            
            logger.info(`Importación masiva completada para cliente ${clienteId}: ${resultados.exitosos} exitosos, ${resultados.errores.length} errores.`);
            
        } catch (transactionError) {
            logger.error('Error en la transacción de importación:', transactionError);
            throw transactionError;
        } finally {
            session.endSession();
        }
        
        return resultados;
    } catch (error) {
        logger.error('Error general en bulkImportTramos:', error);
        throw error;
    }
}

/**
 * Obtiene los tramos activos para un cliente específico
 * @param clienteId - ID del cliente
 * @param opciones - Opciones de filtrado
 * @returns Array de tramos filtrados
 */
async function getTramosByCliente(clienteId: string, opciones: { desde?: string; hasta?: string; incluirHistoricos?: string } = {}): Promise<any> {
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
 * @param tramos - Lista de tramos a filtrar
 * @param desde - Fecha inicial (ISO string)
 * @param hasta - Fecha final (ISO string)
 * @returns Objeto con tramos filtrados y metadata
 */
async function obtenerTramosHistoricos(tramos: any[], desde: string, hasta: string): Promise<any> {
    logger.debug('Procesando tramos históricos con filtro de fecha');
    
    // Convertir fechas a objetos Date para comparación
    const desdeDate = new Date(desde);
    const hastaDate = new Date(hasta);
    
    logger.debug(`Filtrando tramos por rango de fechas: ${desdeDate.toISOString().split('T')[0]} - ${hastaDate.toISOString().split('T')[0]}`);
    
    // Usar reduce para construir el Map de tramos únicos en una sola pasada
    const tramosUnicos = tramos.reduce((mapaTramos: Map<string, any>, tramo: any) => {
        // Añadir verificación dentro del reduce para manejar tramos sin origen/destino
        if (!tramo || !tramo.origen || !tramo.destino) {
            logger.warn('Omitiendo tramo sin origen/destino en procesamiento histórico:', tramo?._id);
            return mapaTramos; // Omitir este tramo
        }

        // Función para verificar si una fecha se superpone con el rango solicitado
        const estaEnRango = (fechaDesde: Date, fechaHasta: Date): boolean => {
            const desde = new Date(fechaDesde);
            const hasta = new Date(fechaHasta);
            return desde <= hastaDate && hasta >= desdeDate;
        };
        
        // Función para crear la clave única por origen-destino-tipo
        const crearClave = (origen: any, destino: any, tipo: string): string => 
            `${origen.Site}-${destino.Site}-${tipo || 'TRMC'}`;
            
        // Función para actualizar el mapa con un tramo si es más reciente
        const actualizarMapa = (clave: string, tramoActualizado: any, fechaHasta: Date): Map<string, any> => {
            if (!mapaTramos.has(clave) || 
                fechaHasta > new Date(mapaTramos.get(clave).vigenciaHasta)) {
                mapaTramos.set(clave, tramoActualizado);
            }
            return mapaTramos;
        };
        
        // Caso 1: Tramo con tarifas históricas
        if (tramo.tarifasHistoricas?.length > 0) {
            // Filtrar tarifas que se superpongan con el rango de fechas solicitado
            const tarifasEnRango = tramo.tarifasHistoricas.filter((tarifa: any) => 
                estaEnRango(tarifa.vigenciaDesde, tarifa.vigenciaHasta)
            );
            
            // Agrupar por tipo y obtener la más reciente para cada tipo
            const tiposTarifa = [...new Set(tarifasEnRango.map((t: any) => t.tipo))];
            
            tiposTarifa.forEach(tipo => {
                // Obtener la tarifa más reciente de este tipo
                const tarifaMasReciente = tarifasEnRango
                    .filter((t: any) => t.tipo === tipo)
                    .sort((a: any, b: any) => new Date(b.vigenciaHasta).getTime() - new Date(a.vigenciaHasta).getTime())[0];
                
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
 * @param tramos - Lista de tramos a procesar
 * @returns Objeto con tramos actuales y metadata
 */
function obtenerTramosActuales(tramos: any[]): any {
    // Función para crear la clave única por origen-destino-tipo
    const crearClave = (origen: any, destino: any, tipo: string): string => 
        // Manejar posible nulidad de origen/destino al crear la clave
        `${origen?.Site || 'null'}-${destino?.Site || 'null'}-${tipo || 'TRMC'}`;
        
    // Usar reduce para construir el Map de tramos únicos en una sola pasada
    const tramosUnicos = tramos.reduce((mapaTramos: Map<string, any>, tramo: any) => {
        // Añadir verificación dentro del reduce para manejar tramos sin origen/destino
        if (!tramo || !tramo.origen || !tramo.destino) {
            logger.warn('Omitiendo tramo sin origen/destino en procesamiento actual:', tramo?._id);
            return mapaTramos; // Omitir este tramo
        }

        // Caso 1: Tramo con tarifas históricas (modelo nuevo)
        if (tramo.tarifasHistoricas?.length > 0) {
            // Por cada tarifa histórica, crear un tramo con esos datos
            tramo.tarifasHistoricas.forEach((tarifa: any) => {
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
    const resultado = tramosArray.sort((a: any, b: any) => {
        // Primero ordenar por origen (manejar null)
        const origenA = a.origen?.Site || '';
        const origenB = b.origen?.Site || '';
        if (origenA < origenB) return -1;
        if (origenA > origenB) return 1;
        
        // Si origen es igual, ordenar por destino (manejar null)
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
 * @returns Lista de distancias calculadas
 */
async function getDistanciasCalculadas(): Promise<any[]> {
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

/**
 * Crea o actualiza tramos masivamente desde la plantilla de corrección.
 * Resuelve los sitios (origen y destino) por nombre.
 * Crea tarifas históricas iniciales para cada tramo.
 *
 * @param tramosData - Array con datos de tramos extraídos de la plantilla.
 * @param options - Opciones, incluye la session de mongoose.
 * @returns Resultado con insertados, actualizados y errores.
 */
const createTramosBulk = async (tramosData: TramosBulkData[], options: { session?: mongoose.ClientSession } = {}): Promise<CreateTramosBulkResult> => {
    const session = options.session;
    let insertados = 0;
    let actualizados = 0;
    const errores: CreateTramosBulkResult['errores'] = [];
    const operations: any[] = [];

    if (!Array.isArray(tramosData) || tramosData.length === 0) {
        return { success: false, insertados, actualizados, errores: [{ message: 'No tramo data provided for bulk operation.' }] };
    }
    logger.info(`[createTramosBulk] Iniciando proceso para ${tramosData.length} tramos.`);

    // 1. Extraer todos los nombres de sitios necesarios para consulta
    const sitiosNecesarios = [...new Set([
        ...tramosData.map(t => t.origenNombre),
        ...tramosData.map(t => t.destinoNombre)
    ])].filter(nombre => nombre);

    // 2. Buscar los sitios por nombre
    const sitios = await Site.find({
        $or: [
            { Site: { $in: sitiosNecesarios } },
            { nombre: { $in: sitiosNecesarios } }
        ]
    }).session(session).lean();

    // 3. Crear mapas para búsqueda rápida
    const sitiosPorNombre = new Map();
    sitios.forEach(sitio => {
        if (sitio.nombre) sitiosPorNombre.set(sitio.nombre.toLowerCase(), sitio);
    });
    logger.debug(`[createTramosBulk] Sitios encontrados: ${sitiosPorNombre.size} de ${sitiosNecesarios.length} necesarios.`);

    // 4. Obtener los tramos existentes para determinar si actualizar o crear
    const origenesDest: Array<{ origen: any; destino: any }> = [];
    const clienteIds = new Set();

    // Construir pares de origen-destino para buscar tramos existentes
    for (const tramo of tramosData) {
        const origen = sitiosPorNombre.get(tramo.origenNombre?.toLowerCase());
        const destino = sitiosPorNombre.get(tramo.destinoNombre?.toLowerCase());
        
        if (origen && destino) {
            origenesDest.push({ origen: origen._id, destino: destino._id });
            if (origen.Cliente) clienteIds.add(origen.Cliente.toString());
            if (destino.Cliente) clienteIds.add(destino.Cliente.toString());
        }
    }

    // Buscar tramos existentes
    const tramosExistentes = await Tramo.find({
        $or: origenesDest.map(par => ({
            origen: par.origen,
            destino: par.destino
        })),
        cliente: { $in: [...clienteIds] }
    }).session(session).lean();

    // Crear mapa de tramos existentes para búsqueda rápida
    const tramosPorOrigenDestino = new Map();
    tramosExistentes.forEach(tramo => {
        const key = `${tramo.origen.toString()}-${tramo.destino.toString()}-${tramo.cliente.toString()}`;
        tramosPorOrigenDestino.set(key, tramo);
    });
    logger.debug(`[createTramosBulk] Tramos existentes encontrados: ${tramosPorOrigenDestino.size}.`);

    // 5. Procesar cada tramo
    for (const [index, tramoData] of tramosData.entries()) {
        try {
            // Validar campos básicos
            if (!tramoData.origenNombre || !tramoData.destinoNombre || !tramoData.tipoTarifa || 
                !tramoData.metodoCalculo || isNaN(tramoData.valorTarifa) || 
                !tramoData.vigenciaDesde || !tramoData.vigenciaHasta) {
                errores.push({ 
                    index, 
                    message: 'Faltan campos requeridos en el tramo', 
                    data: tramoData 
                });
                continue;
            }

            // Buscar sitios
            const origenSite = sitiosPorNombre.get(tramoData.origenNombre.toLowerCase());
            const destinoSite = sitiosPorNombre.get(tramoData.destinoNombre.toLowerCase());

            if (!origenSite) {
                errores.push({ 
                    index, 
                    message: `Sitio origen "${tramoData.origenNombre}" no encontrado`, 
                    data: tramoData 
                });
                continue;
            }

            if (!destinoSite) {
                errores.push({ 
                    index, 
                    message: `Sitio destino "${tramoData.destinoNombre}" no encontrado`, 
                    data: tramoData 
                });
                continue;
            }

            // Determinar el cliente (usar el del sitio origen o destino)
            const clienteId = origenSite.Cliente || destinoSite.Cliente;
            if (!clienteId) {
                errores.push({ 
                    index, 
                    message: 'No se pudo determinar el cliente para el tramo', 
                    data: tramoData 
                });
                continue;
            }

            // Procesar fechas
            let fechaDesde: Date, fechaHasta: Date;
            try {
                fechaDesde = new Date(tramoData.vigenciaDesde);
                fechaHasta = new Date(tramoData.vigenciaHasta);
                
                // Validar fechas
                if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime()) || fechaDesde > fechaHasta) {
                    throw new Error('Fechas de vigencia inválidas o rango incorrecto');
                }
            } catch (fechaError) {
                errores.push({ 
                    index, 
                    message: `Error en fechas: ${(fechaError as Error).message}`, 
                    data: tramoData 
                });
                continue;
            }

            // Validar valores numéricos
            const valorTarifa = parseFloat(String(tramoData.valorTarifa));
            const valorPeaje = parseFloat(String(tramoData.valorPeaje || 0));
            
            if (isNaN(valorTarifa) || valorTarifa <= 0) {
                errores.push({ 
                    index, 
                    message: 'Valor de tarifa inválido o menor/igual a cero', 
                    data: tramoData 
                });
                continue;
            }

            // Crear la nueva tarifa histórica
            const nuevaTarifa: TarifaHistorica = {
                tipo: tramoData.tipoTarifa.toUpperCase(),
                metodoCalculo: tramoData.metodoCalculo,
                valor: valorTarifa,
                valorPeaje: valorPeaje,
                vigenciaDesde: fechaDesde,
                vigenciaHasta: fechaHasta
            };

            // Verificar si el tramo ya existe
            const tramoKey = `${origenSite._id.toString()}-${destinoSite._id.toString()}-${clienteId.toString()}`;
            const tramoExistente = tramosPorOrigenDestino.get(tramoKey);

            if (tramoExistente) {
                // Verificar conflictos de fechas si el tramo existe
                let conflictoDetectado = false;

                if (tramoExistente.tarifasHistoricas && tramoExistente.tarifasHistoricas.length > 0) {
                    for (const tarifaExistente of tramoExistente.tarifasHistoricas) {
                        // Solo verificar conflictos para tarifas del mismo tipo y método
                        if (tarifaExistente.tipo === nuevaTarifa.tipo && 
                            tarifaExistente.metodoCalculo === nuevaTarifa.metodoCalculo) {
                            
                            // Verificar superposición de fechas
                            if (fechasSuperpuestas(
                                nuevaTarifa.vigenciaDesde, nuevaTarifa.vigenciaHasta,
                                tarifaExistente.vigenciaDesde, tarifaExistente.vigenciaHasta
                            )) {
                                conflictoDetectado = true;
                                break;
                            }
                        }
                    }
                }

                if (conflictoDetectado) {
                    errores.push({
                        index,
                        message: 'Conflicto de fechas con tarifa existente del mismo tipo',
                        data: tramoData
                    });
                } else {
                    // Actualizar tramo existente con nueva tarifa
                    operations.push({
                        updateOne: {
                            filter: { _id: tramoExistente._id },
                            update: { $push: { tarifasHistoricas: nuevaTarifa } }
                        }
                    });
                }
            } else {
                // Crear nuevo tramo con tarifa inicial
                operations.push({
                    insertOne: {
                        document: {
                            origen: origenSite._id,
                            destino: destinoSite._id,
                            cliente: clienteId,
                            distancia: 0, // Se podría calcular a futuro
                            tarifasHistoricas: [nuevaTarifa]
                        }
                    }
                });
            }
        } catch (error) {
            logger.error(`[createTramosBulk] Error procesando tramo en índice ${index}:`, error);
            errores.push({
                index,
                message: `Error procesando tramo: ${(error as Error).message}`,
                data: tramoData
            });
        }
    }

    // 6. Ejecutar operaciones bulkWrite
    if (operations.length > 0) {
        try {
            const result = await Tramo.bulkWrite(operations, { session, ordered: false });
            insertados = result.insertedCount;
            actualizados = result.modifiedCount;
            logger.info(`[createTramosBulk] BulkWrite completado. Insertados: ${insertados}, Actualizados: ${actualizados}`);

            // Manejar errores de escritura
            if (result.hasWriteErrors && result.hasWriteErrors()) {
                const writeErrors = result.getWriteErrors();
                logger.warn(`[createTramosBulk] ${writeErrors.length} errores durante bulkWrite.`);
                
                writeErrors.forEach(err => {
                    errores.push({
                        index: 'N/A', // Es difícil mapear el error al índice original
                        message: `Error en operación: ${err.errmsg}`,
                        code: err.code,
                        data: err.op
                    });
                });
            }
        } catch (error) {
            logger.error('[createTramosBulk] Error durante bulkWrite:', error);
            errores.push({ message: `Error general durante bulkWrite: ${(error as Error).message}` });
        }
    } else {
        logger.info('[createTramosBulk] No se prepararon operaciones válidas.');
    }

    return {
        success: errores.length === 0,
        insertados,
        actualizados,
        errores
    };
};

// Exportar las funciones públicas
export {
    bulkImportTramos,
    getTramosByCliente,
    getDistanciasCalculadas,
    createTramosBulk
};