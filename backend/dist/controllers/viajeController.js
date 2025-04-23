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
const Viaje = require('../models/Viaje');
const logger = require('../utils/logger');
const Cliente = require('../models/Cliente');
const Personal = require('../models/Personal');
const Vehiculo = require('../models/Vehiculo');
const Site = require('../models/Site');
const Tramo = require('../models/Tramo');
const Empresa = require('../models/Empresa'); // *** Asegurarse que Empresa esté importado ***
const mongoose = require('mongoose');
const ImportacionTemporal = require('../models/ImportacionTemporal');
const ExcelJS = require('exceljs');
const fs = require('fs'); // Necesario para borrar archivo temporal si se usa path
const path = require('path'); // Necesario para manejar paths
// Importar controladores y servicios necesarios
const siteController = require('./site/site.controller'); // Usar el controlador de site
const personalController = require('./personalController'); // Usar el controlador de personal
const vehiculoService = require('../services/vehiculo/vehiculoService'); // Ruta existente
const tramoService = require('../services/tramo/tramoService'); // Ruta corregida para tramoService
// Helper function to escape regex special characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
exports.getViajes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger.debug('Obteniendo lista de viajes');
        // Parámetros de paginación
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20; // Límite por defecto
        const skip = (page - 1) * limit;
        // Construir el objeto de filtro
        const filter = {};
        if (req.query.cliente && mongoose.Types.ObjectId.isValid(req.query.cliente)) {
            filter.cliente = req.query.cliente;
            logger.debug(`Filtrando viajes por cliente: ${req.query.cliente}`);
        }
        else {
            logger.debug('No se proporcionó un cliente válido para filtrar o no se proporcionó cliente. Devolviendo todos los viajes (paginados).');
            // Opcional: podrías decidir devolver un array vacío o un error si un cliente es obligatorio
            // return res.status(400).json({ message: 'Cliente ID es requerido para ver los viajes' });
        }
        // Contar el total de viajes para la metadata (considerando el filtro)
        const totalViajes = yield Viaje.countDocuments(filter);
        // Obtener viajes con paginación, filtro y poblar datos relacionados
        const viajes = yield Viaje.find(filter)
            .populate({ path: 'cliente', select: 'Cliente' }) // Poblar solo el nombre del cliente
            .populate({ path: 'origen', select: 'Site nombre' }) // Poblar campos relevantes de origen
            .populate({ path: 'destino', select: 'Site nombre' }) // Poblar campos relevantes de destino
            .sort({ fecha: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // Usar lean para mejor rendimiento si no necesitamos métodos del modelo
        logger.debug(`${viajes.length} viajes encontrados (página ${page} de ${Math.ceil(totalViajes / limit)}) con filtro:`, filter);
        // Devolver los viajes con metadata de paginación
        res.json({
            data: viajes,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalViajes / limit),
                totalItems: totalViajes,
                limit: limit
            }
        });
    }
    catch (error) {
        logger.error('Error al obtener viajes:', error);
        res.status(500).json({ message: 'Error al obtener viajes' });
    }
});
exports.getViajeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const viaje = yield Viaje.findById(req.params.id);
        if (!viaje) {
            return res.status(404).json({ message: 'Viaje no encontrado' });
        }
        res.json(viaje);
    }
    catch (error) {
        logger.error('Error al obtener viaje:', error);
        res.status(500).json({ message: 'Error al obtener viaje' });
    }
});
exports.createViaje = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const nuevoViaje = new Viaje(req.body);
        yield nuevoViaje.save();
        res.status(201).json(nuevoViaje);
    }
    catch (error) {
        logger.error('Error al crear viaje:', error);
        res.status(500).json({ message: 'Error al crear viaje' });
    }
});
exports.updateViaje = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const viaje = yield Viaje.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!viaje) {
            return res.status(404).json({ message: 'Viaje no encontrado' });
        }
        res.json(viaje);
    }
    catch (error) {
        logger.error('Error al actualizar viaje:', error);
        res.status(500).json({ message: 'Error al actualizar viaje' });
    }
});
exports.deleteViaje = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const viaje = yield Viaje.findByIdAndDelete(req.params.id);
        if (!viaje) {
            return res.status(404).json({ message: 'Viaje no encontrado' });
        }
        res.json({ message: 'Viaje eliminado exitosamente' });
    }
    catch (error) {
        logger.error('Error al eliminar viaje:', error);
        res.status(500).json({ message: 'Error al eliminar viaje' });
    }
});
/**
 * Crea múltiples viajes en una sola operación
 *
 * @async
 * @function iniciarBulkImportViajes
 * @description Inicia el proceso de importación masiva de viajes en dos etapas.
 *              Etapa 1: Intenta importar todos los viajes, registra éxitos y fallos detallados.
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.body - Cuerpo de la solicitud
 * @param {string} req.body.cliente - ID del cliente
 * @param {Array<Object>} req.body.viajes - Array de objetos con datos de viajes (formato nuevo)
 * @returns {Promise<Object>} Resultado de la operación con viajes creados y errores
 */
exports.iniciarBulkImportViajes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose.startSession();
    session.startTransaction();
    let importacionId = null; // Para almacenar el ID de la importación temporal
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            logger.error('ERROR: Cuerpo de solicitud vacío');
            yield session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Cuerpo de solicitud vacío' });
        }
        const { cliente: clienteId, viajes } = req.body;
        logger.debug('Datos recibidos para bulk import:', {
            clienteId,
            cantidadViajes: (viajes === null || viajes === void 0 ? void 0 : viajes.length) || 0
        });
        if (!mongoose.Types.ObjectId.isValid(clienteId)) {
            yield session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'ID de Cliente inválido' });
        }
        if (!Array.isArray(viajes) || viajes.length === 0) {
            yield session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Formato de datos inválido o sin viajes' });
        }
        // Crear registro de importación temporal
        const importacion = new ImportacionTemporal({
            cliente: clienteId,
            status: 'processing',
            failCountInitial: 0, // Inicializar contadores
            successCountInitial: 0,
            failureDetails: {
                missingSites: { count: 0, details: [] },
                missingPersonal: { count: 0, details: [] },
                missingVehiculos: { count: 0, details: [] },
                missingTramos: { count: 0, details: [] },
                duplicateDt: { count: 0, details: [] },
                invalidData: { count: 0, details: [] },
            },
            failedTrips: [],
        });
        yield importacion.save({ session });
        importacionId = importacion._id; // Guardar el ID para la respuesta
        const clienteDoc = yield Cliente.findById(clienteId).session(session).lean(); // Usar sesión
        if (!clienteDoc) {
            // Actualizar estado de importación a 'failed' si el cliente no existe
            // Guardar el estado 'failed' antes de salir
            yield ImportacionTemporal.findByIdAndUpdate(importacionId, { status: 'failed', failureDetails: { invalidData: { count: 1, details: [`Cliente con ID ${clienteId} no encontrado`] } } }, { session });
            yield session.commitTransaction(); // Commit para guardar el estado 'failed'
            session.endSession();
            // Devolver respuesta indicando fallo por cliente no encontrado
            return res.status(404).json({ success: false, importId: importacionId, message: `Cliente con ID ${clienteId} no encontrado` });
        }
        const clienteNombre = clienteDoc.Cliente;
        // --- Preparación de Datos ---
        const allDtSet = new Set(viajes.map(v => String(v.dt || '').trim()).filter(dt => dt));
        // Identificadores únicos para búsqueda masiva
        const allChoferIdentifiers = [...new Set(viajes.map(v => String(v.chofer || '').trim()).filter(c => c))];
        const allPatentesRaw = viajes.flatMap(v => typeof v.vehiculo === 'string' ? v.vehiculo.split(',') : [])
            .map(p => String(p || '').trim().toUpperCase()).filter(p => p);
        const allPatentes = [...new Set(allPatentesRaw)];
        const allSiteNombresRaw = viajes.flatMap(v => [String(v.origenNombre || '').trim(), String(v.destinoNombre || '').trim()])
            .filter(n => n && n.length > 0); // Asegurar que no sean strings vacíos
        const allSiteNombres = [...new Set(allSiteNombresRaw)];
        const allSiteNombresRegex = allSiteNombres.map(n => new RegExp(`^${escapeRegExp(n)}$`, 'i')); // Regex exacto case-insensitive
        // --- Búsquedas Masivas Iniciales ---
        const dtsExistentes = yield Viaje.find({ cliente: clienteId, dt: { $in: [...allDtSet] } }).select('dt').session(session).lean(); // Usar sesión
        const dtsExistentesSet = new Set(dtsExistentes.map(v => v.dt));
        // Buscar Personal activo por Legajo o DNI
        const choferesDocs = yield Personal.find({
            activo: true,
            $or: [
                { legajo: { $in: allChoferIdentifiers } },
                { dni: { $in: allChoferIdentifiers } }
            ]
        }).session(session).lean(); // Usar sesión
        const choferMap = new Map();
        choferesDocs.forEach(c => {
            const legajoKey = String(c.legajo || '').trim();
            const dniKey = String(c.dni || '').trim();
            if (legajoKey)
                choferMap.set(legajoKey, c);
            if (dniKey)
                choferMap.set(dniKey, c); // Puede sobreescribir si DNI y Legajo coinciden con identificador, ok
        });
        // Buscar Vehículos por Dominio (patente)
        const vehiculosDocs = yield Vehiculo.find({ dominio: { $in: allPatentes } }).session(session).lean(); // Usar sesión
        const vehiculoMap = new Map(vehiculosDocs.map(v => [String(v.dominio).trim().toUpperCase(), v]));
        // Buscar Sites por Nombre o Site (case-insensitive)
        const sitesDocs = yield Site.find({
            $or: [
                // Buscar por el campo 'Site' y 'nombre' usando las regex case-insensitive
                { Site: { $in: allSiteNombresRegex } },
                { nombre: { $in: allSiteNombresRegex } }
            ]
        }).session(session).lean(); // Usar sesión
        const siteMap = new Map();
        sitesDocs.forEach(s => {
            // Usar tanto 'Site' como 'nombre' como claves potenciales, normalizados a lowercase
            const keySite = String(s.Site || '').trim().toLowerCase();
            const keyNombre = String(s.nombre || '').trim().toLowerCase();
            if (keySite)
                siteMap.set(keySite, s);
            // Asegurar que no sobreescribimos con una clave vacía y que añadimos por nombre si es diferente
            if (keyNombre && keyNombre !== keySite)
                siteMap.set(keyNombre, s);
            else if (keyNombre && !keySite)
                siteMap.set(keyNombre, s); // Añadir por nombre si 'Site' estaba vacío
        });
        logger.debug('Datos pre-cargados:', {
            dtsExistentes: dtsExistentesSet.size,
            choferesEncontradosMapa: choferMap.size,
            vehiculosEncontradosMapa: vehiculoMap.size,
            sitesEncontradosMapa: siteMap.size
        });
        // --- Estructuras para Recolectar Datos Faltantes y Viajes Pendientes ---
        const sitesParaCrear = new Set();
        const personalParaCrear = new Set();
        const vehiculosParaCrear = new Set();
        // Usar un Map para tramos para evitar duplicados basados en origen/destino/cliente
        const tramosParaCrearMap = new Map();
        const viajesPendientesCorreccion = []; // Almacena { ...viajeData, missingReasons: [] }
        const failedTripsCritical = []; // Almacena viajes con errores críticos (DT duplicado, datos inválidos)
        let successfulImportsCount = 0; // Contador de éxitos inmediatos
        // --- Procesamiento de Viajes ---
        for (let i = 0; i < viajes.length; i++) {
            const viajeData = viajes[i];
            const indiceOriginal = i; // Mantener el índice original para referencia
            let origenId = null;
            let destinoId = null;
            let choferId = null;
            let vehiculosParaViaje = []; // IDs de vehículos validados para este viaje
            let tarifaSeleccionada = null;
            let tipoTramoFinal = null;
            let tieneDatosFaltantes = false; // Flag para marcar si faltan datos no críticos
            const missingReasons = new Set(); // Razones específicas por las que falta información
            try {
                // --- Validaciones Críticas (DT, Fecha) ---
                const dtNormalizado = String(viajeData.dt || '').trim();
                logger.debug(`Procesando viaje #${indiceOriginal + 1} con DT: ${dtNormalizado}`);
                if (!dtNormalizado) {
                    throw new Error('INVALID_DATA: El campo DT es requerido');
                }
                if (dtsExistentesSet.has(dtNormalizado)) {
                    throw new Error(`DUPLICATE_DT: El DT ${dtNormalizado} ya existe para este cliente`);
                }
                // Validar fecha aquí mismo
                if (!viajeData.fecha || isNaN(new Date(viajeData.fecha).getTime())) {
                    throw new Error(`INVALID_DATA: Fecha inválida: ${viajeData.fecha}`);
                }
                const fechaViaje = new Date(viajeData.fecha); // Fecha válida
                // --- Validación de Sites (Origen y Destino) ---
                if (!viajeData.origenNombre || !viajeData.destinoNombre) {
                    throw new Error('INVALID_DATA: Los campos Origen y Destino son requeridos');
                }
                const origenNombreInput = String(viajeData.origenNombre).trim(); // Mantener case original para mensajes
                const destinoNombreInput = String(viajeData.destinoNombre).trim();
                const origenNombreNorm = origenNombreInput.toLowerCase();
                const destinoNombreNorm = destinoNombreInput.toLowerCase();
                if (!origenNombreNorm || !destinoNombreNorm) {
                    // Este caso es cubierto por la validación anterior, pero por si acaso
                    throw new Error('INVALID_DATA: Los campos Origen y Destino no pueden estar vacíos');
                }
                const origenDoc = siteMap.get(origenNombreNorm);
                const destinoDoc = siteMap.get(destinoNombreNorm);
                if (!origenDoc) {
                    tieneDatosFaltantes = true;
                    missingReasons.add('MISSING_SITE');
                    sitesParaCrear.add(origenNombreInput); // Añadir nombre original
                    logger.warn(`Viaje #${indiceOriginal + 1} (DT: ${dtNormalizado}): Sitio Origen '${origenNombreInput}' no encontrado.`);
                }
                else {
                    origenId = origenDoc._id;
                }
                if (!destinoDoc) {
                    tieneDatosFaltantes = true;
                    missingReasons.add('MISSING_SITE');
                    sitesParaCrear.add(destinoNombreInput); // Añadir nombre original
                    logger.warn(`Viaje #${indiceOriginal + 1} (DT: ${dtNormalizado}): Sitio Destino '${destinoNombreInput}' no encontrado.`);
                }
                else {
                    destinoId = destinoDoc._id;
                }
                // --- Validación de Personal (Chofer) ---
                if (!viajeData.chofer) {
                    throw new Error('INVALID_DATA: El campo Chofer (Legajo/DNI) es requerido');
                }
                const choferIdentifierInput = String(viajeData.chofer).trim();
                if (!choferIdentifierInput) {
                    throw new Error('INVALID_DATA: El campo Chofer (Legajo/DNI) no puede estar vacío');
                }
                const choferDoc = choferMap.get(choferIdentifierInput); // Búsqueda por identificador exacto
                if (!choferDoc) {
                    tieneDatosFaltantes = true;
                    missingReasons.add('MISSING_PERSONAL');
                    personalParaCrear.add(choferIdentifierInput); // Añadir identificador original
                    logger.warn(`Viaje #${indiceOriginal + 1} (DT: ${dtNormalizado}): Chofer '${choferIdentifierInput}' no encontrado o inactivo.`);
                }
                else {
                    choferId = choferDoc._id;
                }
                // --- Validación de Vehículos ---
                if (!viajeData.vehiculo || typeof viajeData.vehiculo !== 'string' || viajeData.vehiculo.trim() === '') {
                    throw new Error('INVALID_DATA: El campo Vehículos (patentes) es requerido y no puede estar vacío');
                }
                const vehiculoInput = String(viajeData.vehiculo).trim();
                const patentesArrayNorm = vehiculoInput.split(',')
                    .map(p => String(p || '').trim().toUpperCase())
                    .filter(p => p); // Filtra patentes vacías
                if (patentesArrayNorm.length === 0) {
                    throw new Error('INVALID_DATA: Debe ingresar al menos una patente válida en Vehículos');
                }
                let todosVehiculosEncontrados = true; // Asumir que todos existen inicialmente
                vehiculosParaViaje = []; // Reiniciar por cada viaje
                for (let j = 0; j < patentesArrayNorm.length; j++) {
                    const patenteNorm = patentesArrayNorm[j];
                    const vehiculoDoc = vehiculoMap.get(patenteNorm);
                    if (!vehiculoDoc) {
                        todosVehiculosEncontrados = false; // Marcar que al menos uno falta
                        tieneDatosFaltantes = true;
                        missingReasons.add('MISSING_VEHICULO');
                        vehiculosParaCrear.add(patenteNorm); // Añadir patente faltante
                        logger.warn(`Viaje #${indiceOriginal + 1} (DT: ${dtNormalizado}): Vehículo con patente '${patenteNorm}' no encontrado.`);
                        // NO añadir a vehiculosParaViaje si no se encontró
                    }
                    else {
                        // Solo añadir a la lista del viaje si el vehículo fue encontrado
                        vehiculosParaViaje.push({
                            vehiculo: vehiculoDoc._id,
                            posicion: j + 1
                        });
                    }
                }
                // Si no se encontró *ningún* vehículo válido, el viaje no puede continuar (error crítico)
                if (vehiculosParaViaje.length === 0 && !todosVehiculosEncontrados) {
                    // Este caso implica que todas las patentes listadas faltaban.
                    // Se podría considerar crítico o simplemente marcar como pendiente.
                    // Por ahora, lo marcaremos como pendiente.
                    logger.warn(`Viaje #${indiceOriginal + 1} (DT: ${dtNormalizado}): Ninguna de las patentes (${patentesArrayNorm.join(', ')}) fue encontrada.`);
                }
                else if (vehiculosParaViaje.length === 0 && todosVehiculosEncontrados) {
                    // Esto no debería pasar si patentesArrayNorm.length > 0, pero es una salvaguarda.
                    throw new Error(`INVALID_DATA: Error interno procesando vehículos para DT ${dtNormalizado}.`);
                }
                // --- Validación de Tramo (Solo si Origen y Destino existen) ---
                if (origenId && destinoId) { // Solo buscar tramo si tenemos IDs válidos
                    logger.debug(`Buscando Tramos para Viaje #${indiceOriginal + 1} con:`, { clienteId, origenId, destinoId });
                    const tramosCoincidentes = yield Tramo.find({
                        cliente: clienteId,
                        origen: origenId,
                        destino: destinoId
                    }).lean(); // Usamos lean() para mejor rendimiento
                    logger.debug(`Tramos coincidentes encontrados: ${tramosCoincidentes.length}`);
                    if (!tramosCoincidentes || tramosCoincidentes.length === 0) {
                        tieneDatosFaltantes = true;
                        missingReasons.add('MISSING_TRAMO');
                        // Añadir identificador único para el tramo faltante
                        const tramoKey = `${clienteId}_${origenId}_${destinoId}`;
                        if (!tramosParaCrearMap.has(tramoKey)) {
                            tramosParaCrearMap.set(tramoKey, {
                                origenNombre: origenNombreInput, // Guardar nombres originales para la plantilla
                                destinoNombre: destinoNombreInput,
                                fechaRequerida: fechaViaje.toISOString().split('T')[0] // Fecha en que se necesitó
                            });
                        }
                        logger.warn(`Viaje #${indiceOriginal + 1} (DT: ${dtNormalizado}): No se encontró tramo para Cliente ID: ${clienteId}, Origen: ${origenNombreInput}, Destino: ${destinoNombreInput}`);
                    }
                    else {
                        // --- Lógica de Selección de Tarifa (si se encontraron tramos) ---
                        let todasLasTarifasVigentes = [];
                        const fechaViajeDate = fechaViaje; // Ya validada
                        tramosCoincidentes.forEach(tramoDoc => {
                            if (!tramoDoc || !Array.isArray(tramoDoc.tarifasHistoricas) || tramoDoc.tarifasHistoricas.length === 0) {
                                logger.warn(`Tramo ID: ${tramoDoc === null || tramoDoc === void 0 ? void 0 : tramoDoc._id} no tiene tarifas históricas válidas. Saltando este tramo.`);
                                return;
                            }
                            const tarifasVigentesDelTramo = tramoDoc.tarifasHistoricas.filter(tarifa => {
                                // ... (lógica de filtro de fechas sin cambios) ...
                                let vigenciaDesdeDate, vigenciaHastaDate;
                                try {
                                    if (!tarifa.vigenciaDesde || !tarifa.vigenciaHasta) {
                                        throw new Error('Fechas de vigencia faltantes');
                                    }
                                    vigenciaDesdeDate = new Date(tarifa.vigenciaDesde);
                                    vigenciaHastaDate = new Date(tarifa.vigenciaHasta);
                                    if (isNaN(vigenciaDesdeDate) || isNaN(vigenciaHastaDate)) {
                                        throw new Error('Fechas de vigencia inválidas');
                                    }
                                }
                                catch (e) {
                                    logger.warn(`Tarifa histórica en tramo ${tramoDoc._id} con fechas inválidas/faltantes: ${e.message}`, tarifa);
                                    return false; // Ignorar tarifa con fechas inválidas
                                }
                                return vigenciaDesdeDate <= fechaViajeDate && vigenciaHastaDate >= fechaViajeDate;
                            });
                            todasLasTarifasVigentes.push(...tarifasVigentesDelTramo);
                        });
                        logger.debug(`Total de tarifas vigentes encontradas en todos los tramos (${todasLasTarifasVigentes.length}) para Viaje #${indiceOriginal + 1}`);
                        if (todasLasTarifasVigentes.length === 0) {
                            tieneDatosFaltantes = true;
                            missingReasons.add('MISSING_TRAMO'); // Considerar esto como tramo faltante (sin tarifa vigente)
                            const tramoKey = `${clienteId}_${origenId}_${destinoId}`;
                            if (!tramosParaCrearMap.has(tramoKey)) {
                                tramosParaCrearMap.set(tramoKey, {
                                    origenNombre: origenNombreInput,
                                    destinoNombre: destinoNombreInput,
                                    fechaRequerida: fechaViaje.toISOString().split('T')[0] // Indicar fecha para la tarifa
                                });
                            }
                            logger.warn(`Viaje #${indiceOriginal + 1} (DT: ${dtNormalizado}): No se encontró tarifa vigente para tramo Origen: ${origenNombreInput}, Destino: ${destinoNombreInput} en fecha: ${viajeData.fecha}`);
                        }
                        else {
                            // --- Selección de Tarifa de Mayor Valor ---
                            let maxValorEncontrado = -Infinity;
                            tarifaSeleccionada = null; // Reiniciar por si acaso
                            for (const currentTarifa of todasLasTarifasVigentes) {
                                // ... (lógica de selección de mayor valor sin cambios) ...
                                const currentValor = Number(currentTarifa.valor);
                                if (!isNaN(currentValor) && currentValor > maxValorEncontrado) {
                                    if (typeof currentTarifa.tipo === 'undefined' || currentTarifa.tipo === null || currentTarifa.tipo === '') {
                                        logger.warn(`Tarifa vigente (valor: ${currentValor}) encontrada sin tipo definido. Saltando esta tarifa.`);
                                        continue;
                                    }
                                    maxValorEncontrado = currentValor;
                                    tarifaSeleccionada = currentTarifa;
                                }
                                else if (isNaN(currentValor)) {
                                    logger.warn(`Tarifa histórica con valor inválido encontrada:`, currentTarifa);
                                }
                            }
                            logger.debug(`Tarifa final seleccionada para Viaje #${indiceOriginal + 1}:`, tarifaSeleccionada);
                            if (!tarifaSeleccionada) {
                                tieneDatosFaltantes = true;
                                missingReasons.add('MISSING_TRAMO'); // No se pudo seleccionar una tarifa válida
                                const tramoKey = `${clienteId}_${origenId}_${destinoId}`;
                                if (!tramosParaCrearMap.has(tramoKey)) {
                                    tramosParaCrearMap.set(tramoKey, {
                                        origenNombre: origenNombreInput,
                                        destinoNombre: destinoNombreInput,
                                        fechaRequerida: fechaViaje.toISOString().split('T')[0] // Indicar fecha para la tarifa
                                    });
                                }
                                logger.warn(`Viaje #${indiceOriginal + 1} (DT: ${dtNormalizado}): No se pudo seleccionar tarifa vigente válida (valor/tipo inválido) para fecha: ${viajeData.fecha}`);
                            }
                            else {
                                tipoTramoFinal = tarifaSeleccionada.tipo; // Tipo de la tarifa seleccionada
                            }
                        }
                    }
                }
                else {
                    // Si faltan origen o destino, no podemos buscar el tramo ahora.
                    logger.warn(`Viaje #${indiceOriginal + 1} (DT: ${dtNormalizado}): Búsqueda de tramo omitida porque faltan Origen y/o Destino.`);
                    // Marcar como faltante si no lo estaba ya por site
                    if (!missingReasons.has('MISSING_SITE')) {
                        tieneDatosFaltantes = true; // Asegurar que se marque como pendiente si solo falta tramo por dependencia
                        missingReasons.add('DEPENDS_ON_MISSING_SITE_FOR_TRAMO'); // Razón más específica (opcional)
                    }
                }
                // --- Decisión Final para el Viaje Actual ---
                if (tieneDatosFaltantes) {
                    // Guardar para corrección posterior
                    viajesPendientesCorreccion.push(Object.assign(Object.assign({}, viajeData), { originalIndex: indiceOriginal, missingReasons: [...missingReasons] // Guardar las razones específicas
                     }));
                    logger.info(`Viaje #${indiceOriginal + 1} (DT: ${dtNormalizado}) marcado como pendiente debido a: ${[...missingReasons].join(', ')}`);
                }
                else {
                    // --- Crear y Guardar Viaje (si no faltan datos y no hubo error crítico) ---
                    if (!origenId || !destinoId || !choferId || vehiculosParaViaje.length === 0 || !tipoTramoFinal || !tarifaSeleccionada) {
                        // Sanity check: si llegamos aquí sin 'tieneDatosFaltantes' pero falta algo esencial, es un error lógico.
                        throw new Error(`INVALID_STATE: Viaje #${indiceOriginal + 1} (DT: ${dtNormalizado}) marcado para éxito pero faltan datos clave (Origen/Destino/Chofer/Vehiculo/Tramo/Tarifa).`);
                    }
                    const viajeParaGuardar = new Viaje({
                        cliente: clienteId,
                        fecha: fechaViaje,
                        origen: origenId,
                        destino: destinoId,
                        chofer: choferId,
                        vehiculos: vehiculosParaViaje, // Ya contiene los IDs y posiciones correctos
                        tipoTramo: tipoTramoFinal,
                        paletas: Number(viajeData.paletas) || 0,
                        dt: dtNormalizado,
                        estado: 'Pendiente', // O el estado inicial deseado
                        tarifa: Number(tarifaSeleccionada.valor) || 0,
                        peaje: Number(tarifaSeleccionada.valorPeaje) || 0
                    });
                    // Guardar dentro de la transacción
                    yield viajeParaGuardar.save({ session });
                    // Añadir DT al set para evitar duplicados *dentro de este mismo lote*
                    dtsExistentesSet.add(dtNormalizado);
                    successfulImportsCount++;
                    logger.info(`Viaje #${indiceOriginal + 1} (DT: ${dtNormalizado}) importado exitosamente (en memoria).`);
                }
            }
            catch (error) {
                // --- Manejo de Errores Críticos ---
                logger.error(`Error crítico procesando viaje #${indiceOriginal + 1} (DT: ${viajeData.dt || 'N/A'}): ${error.message}`, error.stack);
                let reason = 'INVALID_DATA'; // Default reason
                let details = error.message;
                // Clasificar error crítico
                if (error.message.startsWith('DUPLICATE_DT:')) {
                    reason = 'DUPLICATE_DT';
                    details = error.message.substring('DUPLICATE_DT:'.length).trim();
                }
                else if (error.message.startsWith('INVALID_DATA:')) {
                    reason = 'INVALID_DATA';
                    details = error.message.substring('INVALID_DATA:'.length).trim();
                }
                else if (error.message.startsWith('INVALID_STATE:')) {
                    // Error lógico interno, tratar como INVALID_DATA o un tipo específico
                    reason = 'INTERNAL_PROCESSING_ERROR';
                    details = error.message.substring('INVALID_STATE:'.length).trim();
                } // Añadir más clasificaciones si es necesario
                failedTripsCritical.push({
                    originalIndex: indiceOriginal,
                    dt: viajeData.dt || `Fila ${indiceOriginal + 1} (Sin DT)`,
                    reason: reason,
                    message: details,
                    data: viajeData // Guardar los datos originales que fallaron
                });
            }
        } // --- Fin del bucle for ---
        // --- Actualizar el registro de ImportacionTemporal ---
        const importacionActualizada = yield ImportacionTemporal.findById(importacionId).session(session);
        if (!importacionActualizada) {
            // Este error debería abortar la transacción
            throw new Error(`FATAL: No se encontró el registro de importación temporal ${importacionId} para actualizar.`);
        }
        // Datos recolectados para la plantilla de corrección
        const collectedFailureDetails = {
            missingSites: { count: sitesParaCrear.size, details: [...sitesParaCrear] },
            missingPersonal: { count: personalParaCrear.size, details: [...personalParaCrear] },
            missingVehiculos: { count: vehiculosParaCrear.size, details: [...vehiculosParaCrear] },
            // Convertir el mapa de tramos a un array de detalles para la plantilla
            missingTramos: { count: tramosParaCrearMap.size, details: [...tramosParaCrearMap.values()] },
            // Detalles de errores críticos
            duplicateDt: { count: 0, details: [] },
            invalidData: { count: 0, details: [] },
            internalProcessingError: { count: 0, details: [] } // Nuevo para errores inesperados
        };
        // Poblar detalles de errores críticos
        failedTripsCritical.forEach(fail => {
            switch (fail.reason) {
                case 'DUPLICATE_DT':
                    const dtMatch = fail.message.match(/DT (\S+)/);
                    if (dtMatch && dtMatch[1] && !collectedFailureDetails.duplicateDt.details.includes(dtMatch[1])) {
                        collectedFailureDetails.duplicateDt.details.push(dtMatch[1]);
                    }
                    collectedFailureDetails.duplicateDt.count++;
                    break;
                case 'INVALID_DATA':
                    if (!collectedFailureDetails.invalidData.details.includes(fail.message)) {
                        collectedFailureDetails.invalidData.details.push(fail.message); // Añadir mensaje específico
                    }
                    collectedFailureDetails.invalidData.count++;
                    break;
                case 'INTERNAL_PROCESSING_ERROR':
                    if (!collectedFailureDetails.internalProcessingError.details.includes(fail.message)) {
                        collectedFailureDetails.internalProcessingError.details.push(fail.message);
                    }
                    collectedFailureDetails.internalProcessingError.count++;
                    break;
            }
        });
        // Actualizar campos del registro de importación
        importacionActualizada.successCountInitial = successfulImportsCount;
        importacionActualizada.failCountInitial = failedTripsCritical.length; // Solo errores críticos
        importacionActualizada.pendingCount = viajesPendientesCorreccion.length; // Nuevo campo
        importacionActualizada.failedTrips = failedTripsCritical; // Guardar solo los críticos aquí
        importacionActualizada.pendingTripsData = viajesPendientesCorreccion; // Guardar datos pendientes
        importacionActualizada.failureDetails = collectedFailureDetails; // Guardar datos recolectados
        // Determinar el estado final de esta fase
        if (viajesPendientesCorreccion.length > 0) {
            importacionActualizada.status = 'pending_correction';
        }
        else if (failedTripsCritical.length > 0) {
            importacionActualizada.status = 'completed_with_errors'; // O simplemente 'completed' si errores críticos no bloquean
        }
        else {
            importacionActualizada.status = 'completed';
        }
        yield importacionActualizada.save({ session });
        // --- Finalizar Transacción ---
        yield session.commitTransaction();
        session.endSession();
        logger.info(`Importación inicial (ID: ${importacionId}) finalizada para cliente ${clienteId}. Éxitos: ${successfulImportsCount}, Pendientes: ${viajesPendientesCorreccion.length}, Errores Críticos: ${failedTripsCritical.length}`);
        // --- Respuesta al Cliente ---
        res.status(200).json({
            success: true,
            importId: importacionId,
            status: importacionActualizada.status,
            successCount: importacionActualizada.successCountInitial,
            pendingCount: importacionActualizada.pendingCount,
            criticalFailCount: importacionActualizada.failCountInitial,
            // Devolver los detalles recolectados para la corrección
            correctionNeeded: importacionActualizada.failureDetails,
            // Opcional: Incluir detalles de errores críticos si es relevante para el frontend
            criticalFailures: importacionActualizada.failedTrips.map(f => ({ dt: f.dt, reason: f.reason, message: f.message }))
        });
    }
    catch (error) {
        // --- Manejo de Errores Fatales (fuera del bucle principal) ---
        // Asegurarse de que la transacción se aborte si no se hizo ya
        if (session.inTransaction()) {
            yield session.abortTransaction();
        }
        session.endSession();
        logger.error('Error fatal durante la importación inicial de viajes:', error);
        // Intentar actualizar el estado a 'failed' si tenemos un ID
        if (importacionId) {
            try {
                // Usar findByIdAndUpdate sin sesión ya que la original falló/se abortó
                yield ImportacionTemporal.findByIdAndUpdate(importacionId, {
                    status: 'failed',
                    // Opcional: Añadir un mensaje de error general
                    failureDetails: Object.assign(Object.assign({}, ((importacionActualizada === null || importacionActualizada === void 0 ? void 0 : importacionActualizada.failureDetails) || {})), { internalProcessingError: { count: 1, details: ['Error fatal en el servidor: ' + error.message] } })
                });
            }
            catch (updateError) {
                logger.error('Error adicional al intentar marcar la importación como fallida:', updateError);
            }
        }
        // Respuesta de error genérica
        res.status(500).json({
            success: false,
            importId: importacionId, // Devolver ID si se generó
            message: 'Error interno del servidor durante la importación inicial.',
            error: error.message // Puede ser útil para depuración
        });
    }
});
/**
 * Genera y descarga una plantilla Excel para corregir datos faltantes.
 *
 * @async
 * @function descargarPlantillaCorreccion
 * @description Busca una importación temporal por ID, extrae los datos faltantes según el tipo
 *              (Site, Personal, Vehiculo, Tramo) y genera un archivo Excel para que el usuario corrija.
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.params - Parámetros de la ruta
 * @param {string} req.params.importId - ID de la importación temporal
 * @param {string} req.params.templateType - Tipo de plantilla a generar ('Site', 'Personal', 'Vehiculo', 'Tramo')
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<void>} - Envía el archivo Excel o un error JSON.
 */
exports.descargarPlantillaCorreccion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { importId, templateType } = req.params;
    logger.info(`[Descarga Plantilla v2] Solicitud - ImportId: ${importId}, Tipo: ${templateType}`);
    try {
        if (!mongoose.Types.ObjectId.isValid(importId)) {
            logger.warn(`[Descarga Plantilla v2] ID de importación inválido: ${importId}`);
            return res.status(400).json({ success: false, message: 'ID de importación inválido' });
        }
        const importacion = yield ImportacionTemporal.findById(importId).lean();
        if (!importacion) {
            logger.warn(`[Descarga Plantilla v2] Importación no encontrada con ID: ${importId}`);
            return res.status(404).json({ success: false, message: 'Importación no encontrada' });
        }
        // Permitir descarga si está pendiente o completada con errores (por si se quiere regenerar)
        // O ajustar según la lógica deseada
        if (importacion.status !== 'pending_correction') {
            logger.warn(`[Descarga Plantilla v2] Estado incorrecto para descarga de corrección ${importId}: ${importacion.status}`);
            // Podrías permitir descargar igualmente, o mantener el error
            return res.status(400).json({ success: false, message: `La importación no está en estado 'pendiente de corrección'. Estado actual: ${importacion.status}` });
        }
        // Asegurarse de que failureDetails exista
        if (!importacion.failureDetails) {
            logger.error(`[Descarga Plantilla v2] Faltan 'failureDetails' en la importación ${importId}.`);
            return res.status(500).json({ success: false, message: 'Error interno: Faltan detalles de errores en la importación.' });
        }
        // --- Configuración de Plantillas (Actualizada para Personal y Tramo) --- 
        const templateConfig = {
            'Site': {
                failureKey: 'missingSites',
                // Encabezados ajustados para reflejar que se pide información para CREAR el sitio
                headers: [
                    { header: 'Nombre Sitio a Crear*', key: 'nombreFaltante', width: 30 }, // Clave coincide con 'details'
                    { header: 'Código', key: 'codigo', width: 15 }, // Datos a completar
                    { header: 'Dirección', key: 'direccion', width: 40 },
                    { header: 'Localidad', key: 'localidad', width: 30 },
                    { header: 'Provincia', key: 'provincia', width: 30 },
                    { header: 'Longitud*', key: 'longitud', width: 18 },
                    { header: 'Latitud*', key: 'latitud', width: 18 },
                ],
                dataTransform: (detail) => ({ nombreFaltante: detail }), // Mapear el string a la columna correcta
                description: 'Complete los datos de los sitios faltantes. Longitud y Latitud son requeridas.'
            },
            'Personal': {
                failureKey: 'missingPersonal',
                headers: [
                    { header: 'Identificador Faltante (Legajo/DNI)*', key: 'identificadorFaltante', width: 35 }, // Clave coincide con 'details'
                    { header: 'Nombre*', key: 'nombre', width: 25 }, // Datos a completar
                    { header: 'Apellido*', key: 'apellido', width: 25 },
                    { header: 'DNI*', key: 'dni', width: 15 },
                    { header: 'Legajo', key: 'legajo', width: 15 },
                    { header: 'Tipo* (Chofer/Administrativo/...)', key: 'tipo', width: 30 }, // Aclarar ejemplo
                    { header: 'Empresa (ID o Nombre)*', key: 'empresa', width: 30 },
                    // Quitar opción 'Activar' ya que estamos creando, no activando existentes inactivos en esta plantilla
                    // { header: '¿Activar Personal Existente? (SI/NO)', key: 'activar', width: 30 },
                ],
                dataTransform: (detail) => ({ identificadorFaltante: detail }),
                description: 'Complete los datos del personal faltante (Nombre, Apellido, DNI, Tipo, Empresa). Use ID o Nombre de la hoja Empresas.'
            },
            'Vehiculo': {
                failureKey: 'missingVehiculos',
                headers: [
                    { header: 'Patente Faltante*', key: 'patenteFaltante', width: 20 }, // Clave coincide con 'details'
                    { header: 'Tipo de Vehículo*', key: 'tipo', width: 20 }, // Datos a completar
                    { header: 'Empresa (ID o Nombre)*', key: 'empresa', width: 30 },
                    { header: 'Marca', key: 'marca', width: 20 },
                    { header: 'Modelo', key: 'modelo', width: 20 },
                    { header: 'Año', key: 'anio', width: 10 },
                ],
                dataTransform: (detail) => ({ patenteFaltante: detail }),
                description: 'Complete los datos de los vehículos faltantes. Use ID o Nombre de la hoja Empresas.'
            },
            'Tramo': {
                failureKey: 'missingTramos',
                headers: [
                    // Origen y Destino vienen pre-llenados desde 'details'
                    { header: 'Origen (Nombre)*', key: 'origenNombre', width: 30 }, // Cambiado de 'origenFaltante'
                    { header: 'Destino (Nombre)*', key: 'destinoNombre', width: 30 }, // Cambiado de 'destinoFaltante'
                    { header: 'Fecha Requerida', key: 'fechaRequerida', width: 20 }, // Fecha en que se necesitó tarifa
                    // Columnas para definir la tarifa histórica inicial
                    { header: 'Tipo Tarifa* (TRMC/TRMI)', key: 'tipo', width: 25 },
                    { header: 'Método Cálculo* (Kilometro/Palet/Fijo)', key: 'metodoCalculo', width: 35 },
                    { header: 'Valor Tarifa*', key: 'valor', width: 15 },
                    { header: 'Valor Peaje', key: 'valorPeaje', width: 15 },
                    { header: 'Vigencia Desde* (YYYY-MM-DD)', key: 'vigenciaDesde', width: 25 },
                    { header: 'Vigencia Hasta* (YYYY-MM-DD)', key: 'vigenciaHasta', width: 25 },
                ],
                // El detail ya es un objeto { origenNombre, destinoNombre, fechaRequerida }
                dataTransform: (detail) => detail,
                description: 'Complete los datos para crear la tarifa inicial del tramo faltante. Use el Nombre exacto del Sitio. Vigencia Desde/Hasta deben cubrir la Fecha Requerida.'
            }
        };
        if (!templateConfig[templateType]) {
            logger.warn(`[Descarga Plantilla v2] Tipo de plantilla no válido: ${templateType}`);
            return res.status(400).json({ success: false, message: `Tipo de plantilla no válido: ${templateType}` });
        }
        const config = templateConfig[templateType];
        // Validar que la clave exista en failureDetails
        if (!importacion.failureDetails[config.failureKey]) {
            logger.error(`[Descarga Plantilla v2] La clave de fallo '${config.failureKey}' no existe en failureDetails para ${importId}.`, importacion.failureDetails);
            return res.status(500).json({ success: false, message: `Error interno: Datos de fallo para ${templateType} no encontrados.` });
        }
        const failureData = importacion.failureDetails[config.failureKey];
        const headers = config.headers;
        const dataToPopulate = failureData.details || []; // Asegurar que sea un array
        // --- Crear Libro Excel --- 
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'SistemaGestion';
        workbook.lastModifiedBy = 'SistemaGestion';
        workbook.created = new Date();
        workbook.modified = new Date();
        // --- Añadir Hojas Estándar --- 
        addInstructionsSheet(workbook, templateType, config);
        addFormatsSheet(workbook, templateType, headers);
        // --- Hoja Principal de Corrección --- 
        const correctionSheet = workbook.addWorksheet(`Correccion_${templateType}`);
        correctionSheet.columns = headers;
        // Extraer identificadores únicos faltantes (como antes)
        let itemsFaltantesUnicos = [];
        if (failureData && Array.isArray(failureData.details) && failureData.details.length > 0) {
            if (templateType === 'Tramo') {
                const tramosSet = new Set(failureData.details.map(d => `${d.origen}-${d.destino}-${d.tipoUnidad}`));
                itemsFaltantesUnicos = [...tramosSet].map(t => {
                    const [origen, destino, tipoUnidad] = t.split('-');
                    return { origenFaltante: origen, destinoFaltante: destino, tipoUnidad: tipoUnidad };
                });
            }
            else {
                const keyFaltante = headers[0].key;
                const identificadoresSet = new Set(failureData.details.map(d => d.identifier || d));
                itemsFaltantesUnicos = [...identificadoresSet].map(id => ({ [keyFaltante]: id }));
            }
            correctionSheet.addRows(itemsFaltantesUnicos);
        }
        else {
            correctionSheet.addRow([]);
            const noDataCell = correctionSheet.getCell(`A${correctionSheet.rowCount}`);
            noDataCell.value = '(No se encontraron elementos específicos faltantes para este tipo. Puede añadir filas manualmente si es necesario.)';
            correctionSheet.mergeCells(correctionSheet.rowCount, 1, correctionSheet.rowCount, headers.length);
            noDataCell.font = { italic: true };
            noDataCell.alignment = { horizontal: 'center' };
        }
        // Aplicar formato a cabeceras de la hoja de corrección
        const headerRow = correctionSheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
        // --- Añadir Hoja de Empresas (si aplica) --- 
        if (['Personal', 'Vehiculo'].includes(templateType)) {
            try {
                const empresas = yield Empresa.find({}).select('_id nombre').lean();
                addEmpresasSheet(workbook, empresas);
                logger.info(`[Descarga Plantilla v2] Añadida hoja 'Empresas' con ${empresas.length} registros.`);
            }
            catch (empError) {
                logger.error('[Descarga Plantilla v2] Error al buscar Empresas:', empError);
                // Continuar sin la hoja de empresas si falla, pero loguear el error
            }
        }
        // --- Enviar Respuesta ---
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Plantilla_Correccion_${templateType}_${importId}.xlsx"`);
        yield workbook.xlsx.write(res);
        logger.info(`[Descarga Plantilla v2] Plantilla ${templateType} para importación ${importId} generada y enviada.`);
    }
    catch (error) {
        logger.error(`[Descarga Plantilla v2] Error fatal al generar plantilla ${templateType} para importación ${importId}:`, error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Error interno al generar la plantilla de corrección.' });
        }
    }
});
/**
 * @async
 * @function procesarPlantillaCorreccion
 * @description Procesa un archivo Excel de corrección subido por el usuario (Site, Personal, Vehiculo, Tramo)
 *              y crea las entidades correspondientes usando los servicios de bulk create.
 * @param {Object} req - Objeto de solicitud Express
 * @param {string} req.params.importId - ID de la importación temporal.
 * @param {string} req.params.templateType - Tipo de plantilla a procesar ('Site', 'Personal', 'Vehiculo', 'Tramo').
 * @param {Object} req.file - Archivo subido (manejado por middleware multer).
 * @param {Object} res - Objeto de respuesta Express
 */
exports.procesarPlantillaCorreccion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { importId, templateType } = req.params;
    const file = req.file; // Archivo subido por multer
    logger.info(`Solicitud para procesar plantilla de corrección tipo '${templateType}' para importación ID: ${importId}`);
    if (!file) {
        return res.status(400).json({ success: false, message: 'No se subió ningún archivo de plantilla.' });
    }
    if (!mongoose.Types.ObjectId.isValid(importId)) {
        return res.status(400).json({ success: false, message: 'ID de importación inválido' });
    }
    const validTypes = ['Site', 'Personal', 'Vehiculo', 'Tramo'];
    if (!validTypes.includes(templateType)) {
        return res.status(400).json({ success: false, message: `Tipo de plantilla inválido: ${templateType}` });
    }
    const session = yield mongoose.startSession();
    session.startTransaction();
    try {
        const importacion = yield ImportacionTemporal.findById(importId).session(session);
        if (!importacion) {
            yield session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Importación no encontrada' });
        }
        if (importacion.status !== 'pending_correction') {
            logger.warn(`Intento de procesar plantilla para importación ${importId} en estado ${importacion.status}`);
            // Considerar si permitir o no. Por ahora, permitimos.
        }
        // Leer el archivo Excel desde el buffer
        const workbook = new ExcelJS.Workbook();
        yield workbook.xlsx.load(file.buffer);
        const worksheet = workbook.getWorksheet(1); // Asumir la primera hoja
        if (!worksheet) {
            throw new Error('El archivo Excel no contiene hojas válidas.');
        }
        let extractedData = [];
        let bulkCreateResult = { success: false, insertados: 0, errores: [], message: 'Tipo de plantilla no procesado' };
        // Extraer datos según el tipo de plantilla
        // Es crucial que el mapeo coincida con las cabeceras definidas en descargarPlantillaCorreccion
        // y con lo que esperan los servicios de bulk create.
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            var _a, _b, _c, _d;
            if (rowNumber === 1)
                return; // Saltar cabecera
            let rowData = {};
            try {
                switch (templateType) {
                    case 'Site':
                        rowData = {
                            // Usar la key 'nombreFaltante' definida en las cabeceras. Este será el nombre del nuevo Site.
                            Site: row.getCell('nombreFaltante').value,
                            // No se pide Cliente en la plantilla de corrección de Sites
                            // Cliente: row.getCell('cliente').value, 
                            Codigo: row.getCell('codigo').value,
                            Direccion: row.getCell('direccion').value,
                            Localidad: row.getCell('localidad').value,
                            Provincia: row.getCell('provincia').value,
                            location: {
                                type: 'Point',
                                coordinates: [
                                    parseFloat(row.getCell('longitud').value), // Clave 'longitud' coincide
                                    parseFloat(row.getCell('latitud').value) // Clave 'latitud' coincide
                                ]
                            }
                        };
                        if (!rowData.Site || !((_b = (_a = rowData.location) === null || _a === void 0 ? void 0 : _a.coordinates) === null || _b === void 0 ? void 0 : _b[0]) || !((_d = (_c = rowData.location) === null || _c === void 0 ? void 0 : _c.coordinates) === null || _d === void 0 ? void 0 : _d[1])) {
                            throw new Error(`Faltan campos requeridos (Nombre, Longitud, Latitud) en fila ${rowNumber}`);
                        }
                        if (isNaN(rowData.location.coordinates[0]) || isNaN(rowData.location.coordinates[1])) {
                            throw new Error(`Coordenadas inválidas en fila ${rowNumber}`);
                        }
                        break;
                    case 'Personal':
                        rowData = {
                            // 'identificadorFaltante' es solo para prellenar la plantilla, no se usa para crear.
                            nombre: row.getCell('nombre').value,
                            apellido: row.getCell('apellido').value,
                            dni: String(row.getCell('dni').value || '').trim(),
                            legajo: String(row.getCell('legajo').value || '').trim(),
                            tipo: row.getCell('tipo').value,
                            empresa: row.getCell('empresa').value,
                            // Manejar el campo 'activar'
                            activar: String(row.getCell('activar').value || 'NO').trim().toUpperCase() === 'SI'
                        };
                        if (!rowData.nombre || !rowData.apellido || !rowData.dni || !rowData.tipo || !rowData.empresa) {
                            throw new Error(`Faltan campos requeridos (Nombre, Apellido, DNI, Tipo, Empresa) en fila ${rowNumber}`);
                        }
                        break;
                    case 'Vehiculo':
                        rowData = {
                            // 'patenteFaltante' es solo para prellenar, el dato importante es 'dominio' que no está en la plantilla.
                            // Se asume que el servicio buscará por 'patenteFaltante' y actualizará, o se necesita ajustar la plantilla/lógica.
                            // Por ahora, asumimos que el servicio usará 'patenteFaltante' para buscar y los demás campos para crear/actualizar.
                            patenteFaltante: row.getCell('patenteFaltante').value, // Mantener referencia
                            dominio: String(row.getCell('patenteFaltante').value || '').trim().toUpperCase(), // Usar la patente faltante como dominio por defecto
                            tipo: row.getCell('tipo').value,
                            marca: row.getCell('marca').value,
                            modelo: row.getCell('modelo').value,
                            anio: row.getCell('anio').value ? parseInt(row.getCell('anio').value) : null,
                            empresa: row.getCell('empresa').value,
                        };
                        // El dominio se deriva de 'patenteFaltante', tipo y empresa son requeridos
                        if (!rowData.patenteFaltante || !rowData.tipo || !rowData.empresa) {
                            throw new Error(`Faltan campos requeridos (Patente Faltante, Tipo, Empresa) en fila ${rowNumber}`);
                        }
                        break;
                    case 'Tramo':
                        // Mapear usando las claves correctas de las cabeceras de Tramo
                        rowData = {
                            origenNombre: row.getCell('origenFaltante').value, // Usar clave 'origenFaltante'
                            destinoNombre: row.getCell('destinoFaltante').value, // Usar clave 'destinoFaltante'
                            // No se pide Cliente en la plantilla de Tramo
                            // clienteNombre: row.getCell('cliente').value, 
                            // Datos de la tarifa histórica inicial
                            tipoTarifa: row.getCell('tipo').value, // Usar clave 'tipo'
                            metodoCalculo: row.getCell('metodoCalculo').value, // Usar clave 'metodoCalculo'
                            valorTarifa: parseFloat(row.getCell('valor').value), // Usar clave 'valor'
                            valorPeaje: parseFloat(row.getCell('valorPeaje').value || 0), // Clave 'valorPeaje' coincide
                            vigenciaDesde: row.getCell('vigenciaDesde').value, // Clave 'vigenciaDesde' coincide
                            vigenciaHasta: row.getCell('vigenciaHasta').value, // Clave 'vigenciaHasta' coincide
                        };
                        // Validar campos requeridos para la tarifa
                        if (!rowData.origenNombre || !rowData.destinoNombre || !rowData.tipoTarifa || !rowData.metodoCalculo || isNaN(rowData.valorTarifa) || !rowData.vigenciaDesde || !rowData.vigenciaHasta) {
                            throw new Error(`Faltan campos requeridos o valor de tarifa inválido para la tarifa inicial en fila ${rowNumber}`);
                        }
                        if (isNaN(rowData.valorPeaje)) {
                            throw new Error(`Valor de peaje inválido en fila ${rowNumber}`);
                        }
                        break;
                }
                extractedData.push(rowData);
            }
            catch (parseError) {
                logger.error(`Error parseando fila ${rowNumber} de plantilla ${templateType}: ${parseError.message}`);
                // Podríamos acumular errores de parseo y devolverlos
                throw new Error(`Error en formato de datos en fila ${rowNumber}: ${parseError.message}`);
            }
        });
        logger.debug(`Extraídos ${extractedData.length} registros de la plantilla ${templateType}`);
        if (extractedData.length === 0) {
            throw new Error('La plantilla no contiene datos válidos para procesar.');
        }
        // Llamar al servicio de bulk create correspondiente
        switch (templateType) {
            case 'Site':
                // Usar el controlador de site importado y la nueva función bulk
                bulkCreateResult = yield siteController.createSitesBulk(extractedData, { session });
                break;
            case 'Personal':
                // Asumiendo que personalService.createPersonalBulk existe
                bulkCreateResult = yield personalController.createPersonalBulk(extractedData, { session });
                break;
            case 'Vehiculo':
                // Usar el servicio existente
                bulkCreateResult = yield vehiculoService.createVehiculosBulk(extractedData, { session }); // Pasar session si el servicio lo soporta
                break;
            case 'Tramo':
                // Asumiendo que tramoService.createTramosBulk existe
                // Este servicio necesitaría lógica adicional para buscar IDs de Origen/Destino/Cliente por nombre
                bulkCreateResult = yield tramoService.createTramosBulk(extractedData, { session });
                break;
        }
        logger.info(`Resultado de bulk create para ${templateType}:`, bulkCreateResult);
        // Marcar la plantilla como procesada en la importación temporal
        if (!importacion.processedCorrectionFiles.includes(templateType)) {
            importacion.processedCorrectionFiles.push(templateType);
            yield importacion.save({ session });
        }
        yield session.commitTransaction();
        session.endSession();
        res.status(200).json({
            success: true,
            message: `Plantilla ${templateType} procesada.`,
            result: bulkCreateResult // Devolver el resultado del servicio bulk
        });
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        logger.error(`Error procesando plantilla de corrección tipo '${templateType}' para importación ID ${importId}:`, error);
        res.status(500).json({ success: false, message: `Error al procesar la plantilla ${templateType}.`, error: error.message });
    }
    finally {
        // Opcional: Borrar el archivo temporal si multer lo guarda en disco
        // if (file && file.path) {
        //     fs.unlink(file.path, (err) => {
        //         if (err) logger.error(`Error al borrar archivo temporal ${file.path}:`, err);
        //     });
        // }
    }
});
/**
 * @async
 * @function reintentarImportacionViajes
 * @description Reintenta la importación de los viajes que fallaron en la primera etapa,
 *              utilizando los datos almacenados en ImportacionTemporal.
 * @param {Object} req - Objeto de solicitud Express
 * @param {string} req.params.importId - ID de la importación temporal.
 * @param {Object} res - Objeto de respuesta Express
 */
exports.reintentarImportacionViajes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { importId } = req.params;
    const session = yield mongoose.startSession();
    session.startTransaction();
    logger.info(`Solicitud para reintentar importación de viajes fallidos para ID: ${importId}`);
    try {
        if (!mongoose.Types.ObjectId.isValid(importId)) {
            return res.status(400).json({ success: false, message: 'ID de importación inválido' });
        }
        const importacion = yield ImportacionTemporal.findById(importId).session(session);
        if (!importacion) {
            yield session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Importación no encontrada' });
        }
        if (importacion.status !== 'pending_correction') {
            yield session.abortTransaction();
            session.endSession();
            logger.warn(`Intento de reintentar importación ${importId} que no está pendiente de corrección (estado: ${importacion.status})`);
            return res.status(400).json({ success: false, message: `La importación no está en estado 'pending_correction' (estado actual: ${importacion.status})` });
        }
        // Marcar como reintentando
        importacion.status = 'retrying';
        yield importacion.save({ session });
        const clienteId = importacion.cliente;
        const viajesParaReintentar = importacion.failedTrips; // Usar los viajes que fallaron inicialmente
        if (!viajesParaReintentar || viajesParaReintentar.length === 0) {
            importacion.status = 'completed'; // No hay nada que reintentar
            importacion.successCountRetry = 0;
            importacion.failCountRetry = 0;
            yield importacion.save({ session });
            yield session.commitTransaction();
            session.endSession();
            return res.status(200).json({ success: true, message: 'No había viajes pendientes para reintentar.', result: { exitosos: 0, errores: 0 } });
        }
        logger.info(`Reintentando ${viajesParaReintentar.length} viajes para importación ID: ${importId}`);
        // --- Recargar datos necesarios (similar a la primera etapa, pero ahora entidades podrían existir) ---
        const clienteDoc = yield Cliente.findById(clienteId).session(session).lean();
        if (!clienteDoc)
            throw new Error('Cliente no encontrado durante el reintento.'); // Error interno si esto pasa
        const allDtSetRetry = new Set(viajesParaReintentar.map(v => { var _a; return String(((_a = v.data) === null || _a === void 0 ? void 0 : _a.dt) || '').trim(); }).filter(dt => dt));
        const allChoferIdentifiersRetry = [...new Set(viajesParaReintentar.map(v => { var _a; return String(((_a = v.data) === null || _a === void 0 ? void 0 : _a.chofer) || '').trim(); }).filter(c => c))];
        const allPatentesRawRetry = viajesParaReintentar.flatMap(v => { var _a; return typeof ((_a = v.data) === null || _a === void 0 ? void 0 : _a.vehiculo) === 'string' ? v.data.vehiculo.split(',') : []; })
            .map(p => String(p || '').trim().toUpperCase()).filter(p => p);
        const allPatentesRetry = [...new Set(allPatentesRawRetry)];
        const allSiteNombresRawRetry = viajesParaReintentar.flatMap(v => { var _a, _b; return [String(((_a = v.data) === null || _a === void 0 ? void 0 : _a.origenNombre) || '').trim(), String(((_b = v.data) === null || _b === void 0 ? void 0 : _b.destinoNombre) || '').trim()]; })
            .filter(n => n);
        const allSiteNombresRetry = [...new Set(allSiteNombresRawRetry)];
        const allSiteNombresRegexRetry = allSiteNombresRetry.map(n => new RegExp(`^${escapeRegExp(n)}$`, 'i'));
        // DTs existentes (incluir los de la primera etapa y los ya existentes en DB)
        const dtsInicialesExitosos = yield Viaje.find({ cliente: clienteId, dt: { $in: [...allDtSetRetry] } }).select('dt').session(session).lean();
        const dtsExistentesSetRetry = new Set(dtsInicialesExitosos.map(v => v.dt));
        // Añadir los DTs que tuvieron éxito en la primera etapa (si los hubiera) - No es necesario si ya están en Viaje
        // Añadir los DTs que eran duplicados en la primera etapa
        importacion.failureDetails.duplicateDt.details.forEach(dt => dtsExistentesSetRetry.add(dt));
        const choferesDocsRetry = yield Personal.find({
            activo: true,
            $or: [{ legajo: { $in: allChoferIdentifiersRetry } }, { dni: { $in: allChoferIdentifiersRetry } }]
        }).session(session).lean();
        const choferMapRetry = new Map();
        choferesDocsRetry.forEach(c => {
            if (c.legajo)
                choferMapRetry.set(String(c.legajo).trim(), c);
            if (c.dni)
                choferMapRetry.set(String(c.dni).trim(), c);
        });
        const vehiculosDocsRetry = yield Vehiculo.find({ dominio: { $in: allPatentesRetry } }).session(session).lean();
        const vehiculoMapRetry = new Map(vehiculosDocsRetry.map(v => [String(v.dominio).trim().toUpperCase(), v]));
        const sitesDocsRetry = yield Site.find({
            $or: [{ nombre: { $in: allSiteNombresRegexRetry } }, { Site: { $in: allSiteNombresRegexRetry } }]
        }).session(session).lean();
        const siteMapRetry = new Map();
        sitesDocsRetry.forEach(s => {
            const keySite = String(s.Site || '').trim().toLowerCase();
            const keyNombre = String(s.nombre || '').trim().toLowerCase();
            if (keySite)
                siteMapRetry.set(keySite, s);
            if (keyNombre && keyNombre !== keySite)
                siteMapRetry.set(keyNombre, s);
            else if (keyNombre && !keySite)
                siteMapRetry.set(keyNombre, s);
        });
        logger.debug(`Datos pre-cargados para reintento (Import ID: ${importId}):`, {
            dtsExistentes: dtsExistentesSetRetry.size,
            choferesEncontradosMapa: choferMapRetry.size,
            vehiculosEncontradosMapa: vehiculoMapRetry.size,
            sitesEncontradosMapa: siteMapRetry.size
        });
        // --- Procesar los viajes fallidos ---
        const finalFailedTrips = [];
        let retrySuccessCount = 0;
        for (const failedTrip of viajesParaReintentar) {
            const viajeData = failedTrip.data; // Usar los datos originales guardados
            const indiceOriginal = failedTrip.originalIndex;
            let origenId = null;
            let destinoId = null;
            let choferId = null;
            let vehiculosParaViaje = [];
            let tramoSeleccionado = null;
            try {
                const dtNormalizado = String(viajeData.dt || '').trim();
                logger.debug(`Reintentando viaje #${indiceOriginal + 1} con DT: ${dtNormalizado}`);
                // Re-validar todo, usando los mapas actualizados
                if (!dtNormalizado)
                    throw new Error('INVALID_DATA: El campo DT es requerido');
                if (dtsExistentesSetRetry.has(dtNormalizado)) {
                    // Si sigue siendo duplicado, registrarlo como fallo final
                    throw new Error(`DUPLICATE_DT: El DT ${dtNormalizado} ya existe para este cliente`);
                }
                if (!viajeData.fecha || isNaN(new Date(viajeData.fecha).getTime()))
                    throw new Error(`INVALID_DATA: Fecha inválida: ${viajeData.fecha}`);
                const fechaViaje = new Date(viajeData.fecha);
                if (!viajeData.origenNombre || !viajeData.destinoNombre)
                    throw new Error('INVALID_DATA: Los campos Origen y Destino son requeridos');
                const origenNombreNorm = String(viajeData.origenNombre || '').trim().toLowerCase();
                const destinoNombreNorm = String(viajeData.destinoNombre || '').trim().toLowerCase();
                if (!origenNombreNorm || !destinoNombreNorm)
                    throw new Error('INVALID_DATA: Los campos Origen y Destino son requeridos');
                const origenDoc = siteMapRetry.get(origenNombreNorm);
                const destinoDoc = siteMapRetry.get(destinoNombreNorm);
                if (!origenDoc)
                    throw new Error(`MISSING_SITE: Sitio de Origen '${viajeData.origenNombre}' no encontrado (reintento).`);
                if (!destinoDoc)
                    throw new Error(`MISSING_SITE: Sitio de Destino '${viajeData.destinoNombre}' no encontrado (reintento).`);
                origenId = origenDoc._id;
                destinoId = destinoDoc._id;
                if (!viajeData.chofer)
                    throw new Error('INVALID_DATA: El campo Chofer (Legajo/DNI) es requerido');
                const choferIdentifierNorm = String(viajeData.chofer || '').trim();
                if (!choferIdentifierNorm)
                    throw new Error('INVALID_DATA: El campo Chofer (Legajo/DNI) es requerido');
                const choferDoc = choferMapRetry.get(choferIdentifierNorm);
                if (!choferDoc)
                    throw new Error(`MISSING_PERSONAL: Chofer con identificador '${viajeData.chofer}' no encontrado o inactivo (reintento).`);
                choferId = choferDoc._id;
                if (!viajeData.vehiculo || typeof viajeData.vehiculo !== 'string' || viajeData.vehiculo.trim() === '')
                    throw new Error('INVALID_DATA: El campo Vehículos (patentes) es requerido y no puede estar vacío');
                const vehiculoInput = String(viajeData.vehiculo || '').trim();
                if (!vehiculoInput)
                    throw new Error('INVALID_DATA: El campo Vehículos (patentes) es requerido y no puede estar vacío');
                const patentesArrayNorm = vehiculoInput.split(',').map(p => String(p || '').trim().toUpperCase()).filter(p => p);
                if (patentesArrayNorm.length === 0)
                    throw new Error('INVALID_DATA: Debe ingresar al menos una patente válida en Vehículos');
                vehiculosParaViaje = [];
                for (let j = 0; j < patentesArrayNorm.length; j++) {
                    const patenteNorm = patentesArrayNorm[j];
                    const vehiculoDoc = vehiculoMapRetry.get(patenteNorm);
                    if (!vehiculoDoc)
                        throw new Error(`MISSING_VEHICULO: Vehículo con patente '${patenteNorm}' no encontrado (reintento).`);
                    vehiculosParaViaje.push({ vehiculo: vehiculoDoc._id, posicion: j + 1 });
                }
                // Re-buscar tramo y tarifa
                const tramosCoincidentes = yield Tramo.find({ cliente: clienteId, origen: origenId, destino: destinoId }).lean(); // No necesita session aquí
                if (!tramosCoincidentes || tramosCoincidentes.length === 0)
                    throw new Error(`MISSING_TRAMO: No se encontró tramo para Cliente ID: ${clienteId}, Origen: ${viajeData.origenNombre}, Destino: ${viajeData.destinoNombre} (reintento).`);
                let todasLasTarifasVigentes = [];
                const fechaViajeDate = new Date(fechaViaje); // Ya validada
                tramosCoincidentes.forEach(tramoDoc => {
                    if (tramoDoc && Array.isArray(tramoDoc.tarifasHistoricas)) {
                        const tarifasVigentesDelTramo = tramoDoc.tarifasHistoricas.filter(tarifa => {
                            try {
                                if (!tarifa.vigenciaDesde || !tarifa.vigenciaHasta)
                                    return false;
                                const vigenciaDesdeDate = new Date(tarifa.vigenciaDesde);
                                const vigenciaHastaDate = new Date(tarifa.vigenciaHasta);
                                return !isNaN(vigenciaDesdeDate) && !isNaN(vigenciaHastaDate) &&
                                    vigenciaDesdeDate <= fechaViajeDate && vigenciaHastaDate >= fechaViajeDate;
                            }
                            catch (_a) {
                                return false;
                            }
                        });
                        todasLasTarifasVigentes.push(...tarifasVigentesDelTramo);
                    }
                });
                if (todasLasTarifasVigentes.length === 0)
                    throw new Error(`MISSING_TRAMO: No se encontró tarifa vigente para tramo Origen: ${viajeData.origenNombre}, Destino: ${viajeData.destinoNombre} en fecha: ${viajeData.fecha} (reintento).`);
                let tarifaSeleccionada = null;
                let maxValorEncontrado = -Infinity;
                for (const currentTarifa of todasLasTarifasVigentes) {
                    const currentValor = Number(currentTarifa.valor);
                    if (!isNaN(currentValor) && currentValor > maxValorEncontrado && currentTarifa.tipo) {
                        maxValorEncontrado = currentValor;
                        tarifaSeleccionada = currentTarifa;
                    }
                }
                if (!tarifaSeleccionada)
                    throw new Error(`MISSING_TRAMO: No se pudo seleccionar tarifa vigente válida (valor/tipo inválido) para fecha: ${viajeData.fecha} (reintento).`);
                const tipoTramoFinal = tarifaSeleccionada.tipo;
                // Crear y guardar el viaje AHORA SÍ en la DB
                const viajeParaGuardar = new Viaje({
                    cliente: clienteId,
                    fecha: fechaViaje,
                    origen: origenId,
                    destino: destinoId,
                    chofer: choferId,
                    vehiculos: vehiculosParaViaje,
                    tipoTramo: tipoTramoFinal,
                    paletas: Number(viajeData.paletas) || 0,
                    dt: dtNormalizado,
                    estado: 'Pendiente',
                    tarifa: Number(tarifaSeleccionada.valor) || 0,
                    peaje: Number(tarifaSeleccionada.valorPeaje) || 0
                });
                yield viajeParaGuardar.save({ session });
                dtsExistentesSetRetry.add(dtNormalizado); // Marcar como existente para este reintento
                retrySuccessCount++;
                logger.info(`Viaje DT ${dtNormalizado} importado exitosamente (reintento).`);
            }
            catch (error) {
                logger.warn(`Error reintentando viaje #${indiceOriginal + 1} (DT: ${viajeData === null || viajeData === void 0 ? void 0 : viajeData.dt}): ${error.message}`);
                // Clasificar error final
                let reason = 'RETRY_FAILED'; // Razón genérica de fallo en reintento
                let details = error.message;
                // Re-clasificar si es posible
                if (error.message.startsWith('DUPLICATE_DT:')) {
                    reason = 'DUPLICATE_DT';
                    details = error.message.substring('DUPLICATE_DT:'.length).trim();
                }
                else if (error.message.startsWith('MISSING_SITE:')) {
                    reason = 'MISSING_SITE';
                    details = error.message.substring('MISSING_SITE:'.length).trim();
                }
                else if (error.message.startsWith('MISSING_PERSONAL:')) {
                    reason = 'MISSING_PERSONAL';
                    details = error.message.substring('MISSING_PERSONAL:'.length).trim();
                }
                else if (error.message.startsWith('MISSING_VEHICULO:')) {
                    reason = 'MISSING_VEHICULO';
                    details = error.message.substring('MISSING_VEHICULO:'.length).trim();
                }
                else if (error.message.startsWith('MISSING_TRAMO:')) {
                    reason = 'MISSING_TRAMO';
                    details = error.message.substring('MISSING_TRAMO:'.length).trim();
                }
                else if (error.message.startsWith('INVALID_DATA:')) {
                    reason = 'INVALID_DATA';
                    details = error.message.substring('INVALID_DATA:'.length).trim();
                }
                // Guardar el viaje que falló definitivamente
                finalFailedTrips.push({
                    originalIndex: indiceOriginal,
                    dt: (viajeData === null || viajeData === void 0 ? void 0 : viajeData.dt) || `Fila ${indiceOriginal + 1}`,
                    reason: reason, // Razón final del fallo
                    message: details,
                    data: viajeData
                });
            }
        } // Fin del bucle for (reintento)
        // Actualizar el registro de importación final
        importacion.successCountRetry = retrySuccessCount;
        importacion.failCountRetry = finalFailedTrips.length;
        importacion.failedTrips = finalFailedTrips; // Sobrescribir con los fallos finales
        importacion.status = 'completed';
        yield importacion.save({ session });
        yield session.commitTransaction();
        session.endSession();
        logger.info(`Reintento de importación (ID: ${importId}) finalizado. Exitosos: ${retrySuccessCount}, Fallidos finales: ${finalFailedTrips.length}`);
        res.status(200).json({
            success: true,
            importId: importId,
            status: importacion.status,
            message: `Reintento completado: ${retrySuccessCount} viajes importados, ${finalFailedTrips.length} fallaron definitivamente.`,
            result: {
                exitosos: retrySuccessCount,
                errores: finalFailedTrips.length,
                fallosDetallados: finalFailedTrips // Devolver detalles de los fallos finales
            }
        });
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        logger.error(`Error fatal durante el reintento de importación ID ${importId}:`, error);
        // Intentar marcar como fallido si aún no lo está
        try {
            yield ImportacionTemporal.findByIdAndUpdate(importId, { status: 'failed' });
        }
        catch (updateError) {
            logger.error('Error adicional al intentar marcar la importación como fallida tras error de reintento:', updateError);
        }
        res.status(500).json({
            success: false,
            importId: importId,
            message: 'Error interno del servidor durante el reintento de importación.',
            error: error.message
        });
    }
});
/**
 * @async
 * @function descargarFallbackViajes
 * @description Genera y descarga un archivo Excel con los viajes que fallaron definitivamente
 *              después de la etapa de reintento (o la etapa inicial si no hubo reintento).
 * @param {Object} req - Objeto de solicitud Express
 * @param {string} req.params.importId - ID de la importación temporal.
 * @param {Object} res - Objeto de respuesta Express
 */
exports.descargarFallbackViajes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { importId } = req.params;
    try {
        logger.info(`Solicitud para descargar fallback de viajes fallidos para importación ID: ${importId}`);
        if (!mongoose.Types.ObjectId.isValid(importId)) {
            return res.status(400).json({ success: false, message: 'ID de importación inválido' });
        }
        const importacion = yield ImportacionTemporal.findById(importId).lean();
        if (!importacion) {
            return res.status(404).json({ success: false, message: 'Importación no encontrada' });
        }
        // *** INICIO LOGGING DETALLADO DE IMPORTACION ***
        logger.debug("Datos de Importacion leídos:", JSON.stringify(importacion, null, 2));
        // *** FIN LOGGING DETALLADO DE IMPORTACION ***
        // Idealmente, la descarga debería estar disponible solo si el proceso terminó (completed or failed)
        // o si está pendiente de corrección y el usuario decide no corregir.
        // if (!['completed', 'failed', 'pending_correction'].includes(importacion.status)) {
        //     logger.warn(`Intento de descargar fallback para importación ${importId} en estado ${importacion.status}`);
        //     return res.status(400).json({ success: false, message: `La importación aún está en proceso (estado: ${importacion.status})` });
        // }
        // --- Decidir qué lista de viajes descargar --- 
        // Si está pendiente de corrección, descargar los PENDIENTES.
        // Si está completado/fallido, descargar los FALLIDOS finales.
        let viajesParaDescargar = [];
        let esFallbackPendientes = false;
        if (importacion.status === 'pending_correction' && importacion.pendingTripsData && importacion.pendingTripsData.length > 0) {
            viajesParaDescargar = importacion.pendingTripsData;
            esFallbackPendientes = true;
            logger.info(`Generando fallback para ${viajesParaDescargar.length} viajes PENDIENTES.`);
        }
        else {
            viajesParaDescargar = importacion.failedTrips || []; // Usar fallidos si no está pendiente o no hay pendientes
            logger.info(`Generando fallback para ${viajesParaDescargar.length} viajes FALLIDOS.`);
        }
        // const viajesFallidos = importacion.failedTrips || [];
        if (viajesParaDescargar.length === 0) {
            logger.info(`No hay viajes ${esFallbackPendientes ? 'pendientes' : 'fallidos'} para descargar en fallback para importación ID: ${importId}`);
            // Devolver un mensaje o un archivo vacío? Por ahora, mensaje.
            return res.status(200).json({ success: true, message: `No hay viajes ${esFallbackPendientes ? 'pendientes' : 'fallidos definitivos'} registrados para descargar.` });
        }
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(esFallbackPendientes ? 'Viajes Pendientes' : 'Viajes Fallidos');
        // Usar importacion._id directamente del objeto recuperado para mayor seguridad
        const fileName = `${esFallbackPendientes ? 'Viajes_Pendientes' : 'Viajes_Fallidos'}_Importacion_${importacion._id}.xlsx`;
        // Definir cabeceras - incluir las originales + razón del fallo/pendiente
        const headers = [
            { header: 'Indice Original', key: 'originalIndex', width: 15 },
            { header: 'DT*', key: 'dt', width: 15 },
            { header: 'Fecha (DD/MM/YYYY)*', key: 'fecha', width: 20 },
            { header: 'Origen*', key: 'origenNombre', width: 30 },
            { header: 'Destino*', key: 'destinoNombre', width: 30 },
            { header: 'Chofer (Legajo/DNI)*', key: 'chofer', width: 25 },
            { header: 'Vehículos (Patente1,Patente2,...)*', key: 'vehiculo', width: 35 },
            { header: 'Paletas', key: 'paletas', width: 10 },
            // Columna condicional
            esFallbackPendientes
                ? { header: 'Razones Pendiente', key: 'razonesPendiente', width: 40 }
                : { header: 'Razon Fallo Final', key: 'razonFallo', width: 25 },
            { header: 'Mensaje Error/Detalle', key: 'mensajeError', width: 50 },
        ];
        worksheet.columns = headers;
        // Mapear datos de viajes fallidos/pendientes
        const dataRows = viajesParaDescargar.map(fail => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const rowData = {
                originalIndex: fail.originalIndex !== undefined ? fail.originalIndex + 1 : 'N/A',
                // Acceder a los datos originales, que pueden estar en 'data' (si es fallo) o directamente en el objeto (si es pendiente)
                dt: ((_a = fail.data) === null || _a === void 0 ? void 0 : _a.dt) || fail.dt || 'N/A',
                fecha: ((_b = fail.data) === null || _b === void 0 ? void 0 : _b.fecha) || fail.fecha || 'N/A',
                origenNombre: ((_c = fail.data) === null || _c === void 0 ? void 0 : _c.origenNombre) || fail.origenNombre || 'N/A',
                destinoNombre: ((_d = fail.data) === null || _d === void 0 ? void 0 : _d.destinoNombre) || fail.destinoNombre || 'N/A',
                chofer: ((_e = fail.data) === null || _e === void 0 ? void 0 : _e.chofer) || fail.chofer || 'N/A',
                vehiculo: ((_f = fail.data) === null || _f === void 0 ? void 0 : _f.vehiculo) || fail.vehiculo || 'N/A',
                paletas: (_h = (((_g = fail.data) === null || _g === void 0 ? void 0 : _g.paletas) !== undefined ? fail.data.paletas : fail.paletas)) !== null && _h !== void 0 ? _h : 'N/A', // Usar ?? para manejar null/undefined
                mensajeError: fail.message || (esFallbackPendientes ? 'Ver razones pendiente' : 'Sin mensaje detallado'),
            };
            // Añadir la columna específica de razón
            if (esFallbackPendientes) {
                rowData.razonesPendiente = (fail.missingReasons || []).join(', ');
            }
            else {
                rowData.razonFallo = fail.reason || 'DESCONOCIDA';
            }
            return rowData;
        });
        // *** INICIO LOGGING DETALLADO ***
        console.log("--- Datos a añadir a la hoja de Excel (dataRows) ---");
        console.log(JSON.stringify(dataRows, null, 2)); // Log detallado de los datos
        // *** FIN LOGGING DETALLADO ***
        worksheet.addRows(dataRows);
        // --- Enviar Respuesta ---
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        // Escribir y finalizar la respuesta de forma más robusta
        workbook.xlsx.write(res)
            .then(() => {
            res.end(); // Finalizar solo después de escribir correctamente
            logger.info(`Archivo fallback con ${viajesParaDescargar.length} viajes ${esFallbackPendientes ? 'pendientes' : 'fallidos'} generado y enviado para importación ID: ${importId}`);
        })
            .catch(writeError => {
            // Capturar error específico de la escritura del stream
            logger.error(`Error escribiendo el archivo fallback Excel al stream para importación ID ${importId}:`, writeError);
            // Si los headers no se han enviado, enviar error 500
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: 'Error interno al escribir el archivo de fallback.', error: writeError.message });
            }
            else {
                // Si los headers ya se enviaron, solo intentar finalizar la conexión
                res.end();
            }
        });
        // logger.info(`Archivo fallback con ${viajesFallidos.length} viajes fallidos generado y enviado para importación ID: ${importId}`);
    }
    catch (error) {
        logger.error(`Error al generar fallback de viajes fallidos para importación ID ${importId}:`, error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Error interno al generar el archivo de fallback.', error: error.message });
        }
    }
});
// --- Funciones Helper para Generar Hojas Estándar --- 
// Genera la hoja de Instrucciones
const addInstructionsSheet = (workbook, templateType, config) => {
    const sheet = workbook.addWorksheet('Instrucciones');
    sheet.addRow([`INSTRUCCIONES PARA CORRECCIÓN DE ${templateType.toUpperCase()} FALTANTES`]);
    sheet.mergeCells('A1:E1');
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    sheet.addRow([]); // Fila vacía
    sheet.addRow(['1. Complete los datos requeridos (*) en la hoja ', `Correccion_${templateType}`]);
    sheet.addRow(['2. La primera columna ya contiene los identificadores que faltaron en la importación inicial.']);
    sheet.addRow(['3. Consulte la hoja ', `Formatos ${templateType}`, ' para detalles sobre cada campo.']);
    if (['Personal', 'Vehiculo'].includes(templateType)) {
        // *** Corregir comillas internas aquí ***
        sheet.addRow(['4. Para el campo \'Empresa\', utilice el ID o Nombre exacto como aparece en la hoja ', 'Empresas']);
        sheet.addRow(['5. Guarde el archivo y súbalo usando el botón ', `Subir ${templateType}`]);
    }
    else {
        sheet.addRow(['4. Guarde el archivo y súbalo usando el botón ', `Subir ${templateType}`]);
    }
    sheet.addRow([]);
    sheet.addRow(['NOTA:', config.description]); // Descripción específica del tipo
    sheet.getCell('B' + (sheet.rowCount)).alignment = { wrapText: true };
    sheet.getColumn('A').width = 15;
    sheet.getColumn('B').width = 80;
    return sheet;
};
// Genera la hoja de Formatos
const addFormatsSheet = (workbook, templateType, headers) => {
    const sheetName = `Formatos ${templateType}`;
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = [
        { header: 'CAMPO', key: 'campo', width: 35 },
        { header: 'REQUERIDO', key: 'req', width: 15 },
        { header: 'FORMATO / DESCRIPCIÓN', key: 'desc', width: 65 },
    ];
    sheet.getRow(1).font = { bold: true };
    const formatRows = headers.map(h => {
        const isRequired = h.header.includes('*');
        const cleanHeader = h.header.replace('*', '').replace(/\(.*?\)/g, '').trim(); // Limpiar texto extra entre paréntesis
        let description = '';
        // Descripciones específicas
        if (h.key === 'esDeposito')
            description = 'Indicar SI o NO.';
        else if (h.key === 'activar')
            description = 'Indicar SI para activar personal existente inactivo, o NO/vacío para crear uno nuevo.';
        // *** Personal ***
        else if (templateType === 'Personal' && h.key === 'tipo')
            description = 'Ej: Conductor, Administrativo, Mecánico, Supervisor, Otro.';
        else if (templateType === 'Personal' && h.key === 'empresa')
            description = 'ID o Nombre exacto de la hoja Empresas.';
        // *** Vehiculo ***
        else if (templateType === 'Vehiculo' && h.key === 'anio')
            description = 'Año de fabricación (número).';
        else if (templateType === 'Vehiculo' && h.key === 'empresa')
            description = 'ID o Nombre exacto de la hoja Empresas.';
        // *** Tramo/Tarifa ***
        else if (templateType === 'Tramo' && h.key === 'tipo')
            description = 'Indicar TRMC o TRMI.';
        else if (templateType === 'Tramo' && h.key === 'metodoCalculo')
            description = 'Indicar Kilometro, Palet o Fijo.';
        else if (templateType === 'Tramo' && (h.key === 'valor' || h.key === 'valorPeaje'))
            description = 'Valor numérico (usar punto como decimal).';
        else if (templateType === 'Tramo' && (h.key === 'vigenciaDesde' || h.key === 'vigenciaHasta'))
            description = 'Fecha en formato YYYY-MM-DD.';
        // *** Site ***
        else if (h.key === 'longitud' || h.key === 'latitud')
            description = 'Coordenada geográfica (número decimal, usar punto).';
        // Default
        else
            description = `Dato para ${cleanHeader}.`;
        return {
            campo: cleanHeader,
            req: isRequired ? 'SI' : 'NO',
            desc: description
        };
    });
    sheet.addRows(formatRows);
    // Ajustar alineación y bordes
    sheet.eachRow((row, rowNumber) => {
        row.alignment = { vertical: 'middle', wrapText: true };
        row.getCell('B').alignment = { horizontal: 'center', vertical: 'middle' }; // Centrar columna 'REQUERIDO'
        if (rowNumber > 0) { // Evitar borde superior en cabecera
            row.eachCell({ includeEmpty: true }, function (cell) {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        }
    });
    return sheet;
};
// Genera la hoja de Empresas (si aplica)
const addEmpresasSheet = (workbook, empresas) => {
    if (!empresas || empresas.length === 0)
        return;
    const sheet = workbook.addWorksheet('Empresas');
    sheet.columns = [
        { header: 'ID Empresa', key: 'id', width: 30 },
        { header: 'Nombre Empresa', key: 'nombre', width: 40 },
    ];
    sheet.getRow(1).font = { bold: true };
    const empresaRows = empresas.map(emp => ({ id: emp._id.toString(), nombre: emp.nombre }));
    sheet.addRows(empresaRows);
    return sheet;
};
//# sourceMappingURL=viajeController.js.map