"use strict";
/**
 * Controlador principal para la gestión de sitios
 * Este archivo centraliza todas las operaciones relacionadas con sitios/ubicaciones
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
const logger = require('../../utils/logger');
const Site = require('../../models/Site');
const { tryCatch } = require('../../utils/errorHandler');
const { ValidationError } = require('../../utils/errors');
const { getAddressFromCoords } = require('../../services/geocodingService');
const bulkDeleteSites = require('./bulkDeleteSites');
/**
 * Obtiene todos los sitios con paginación y filtros opcionales
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
const getAllSites = tryCatch((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 50, cliente, search } = req.query;
    // Construir filtros
    const filtro = {};
    if (cliente)
        filtro.Cliente = cliente;
    if (search) {
        filtro.$or = [
            { Site: { $regex: search, $options: 'i' } },
            { Direccion: { $regex: search, $options: 'i' } },
            { Localidad: { $regex: search, $options: 'i' } },
            { Provincia: { $regex: search, $options: 'i' } }
        ];
    }
    // Consulta paginada
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        lean: true,
        sort: { Cliente: 1, Site: 1 }
    };
    try {
        // Realizar consulta
        const sites = yield Site.find(filtro)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .sort({ Cliente: 1, Site: 1 })
            .lean()
            .exec();
        // Obtener total para paginación
        const total = yield Site.countDocuments(filtro);
        // Formatear coordenadas GeoJSON a formato lat/lng
        const sitesFormateados = sites.map(site => {
            const coordenadas = site.location && Array.isArray(site.location.coordinates) ? {
                lng: site.location.coordinates[0],
                lat: site.location.coordinates[1]
            } : null;
            return Object.assign(Object.assign({}, site), { coordenadas });
        });
        logger.debug(`Obtenidos ${sitesFormateados.length} de ${total} sitios`);
        return res.json({
            success: true,
            data: sitesFormateados,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    }
    catch (error) {
        logger.error('Error al obtener sitios:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener sitios',
            error: error.message
        });
    }
}));
/**
 * Obtiene un sitio por su ID
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
const getSiteById = tryCatch((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        throw new ValidationError('ID de sitio requerido');
    }
    const site = yield Site.findById(id).lean().exec();
    if (!site) {
        return res.status(404).json({
            success: false,
            message: 'Sitio no encontrado'
        });
    }
    // Formatear coordenadas
    const coordenadas = site.location && Array.isArray(site.location.coordinates) ? {
        lng: site.location.coordinates[0],
        lat: site.location.coordinates[1]
    } : null;
    const siteFormateado = Object.assign(Object.assign({}, site), { coordenadas });
    return res.json({
        success: true,
        data: siteFormateado
    });
}));
/**
 * Obtiene sitios por cliente
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
const getSitesByCliente = tryCatch((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clienteId } = req.params;
    if (!clienteId) {
        throw new ValidationError('ID de cliente requerido');
    }
    const sites = yield Site.find({ Cliente: clienteId })
        .lean()
        .sort({ Site: 1 })
        .exec();
    const sitesFormateados = sites.map(site => {
        // Convertir coordenadas de GeoJSON a formato lat/lng
        const coordenadas = site.location && Array.isArray(site.location.coordinates) ? {
            lng: site.location.coordinates[0],
            lat: site.location.coordinates[1]
        } : null;
        return Object.assign(Object.assign({}, site), { coordenadas });
    });
    logger.debug(`Obtenidos ${sitesFormateados.length} sitios para cliente ${clienteId}`);
    return res.json({
        success: true,
        count: sitesFormateados.length,
        data: sitesFormateados
    });
}));
/**
 * Crea un nuevo sitio
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
const createSite = tryCatch((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extraer datos del body
    const { nombre, direccion, cliente, localidad, provincia, coordenadas } = req.body;
    // Validar datos esenciales
    if (!nombre || !cliente) {
        throw new ValidationError('Nombre y cliente son requeridos');
    }
    // Convertir coordenadas al formato GeoJSON si existen
    const location = coordenadas ? {
        type: 'Point',
        coordinates: [
            parseFloat(coordenadas.lng),
            parseFloat(coordenadas.lat)
        ]
    } : null;
    try {
        const nuevoSite = new Site({
            Site: nombre,
            Cliente: cliente,
            Direccion: direccion || '-',
            Localidad: localidad || '',
            Provincia: provincia || '',
            location
        });
        yield nuevoSite.save();
        logger.debug(`Sitio creado: ${nuevoSite._id}`);
        return res.status(201).json({
            success: true,
            message: 'Sitio creado exitosamente',
            data: nuevoSite
        });
    }
    catch (error) {
        // Manejar error de duplicado
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un sitio con este nombre para este cliente'
            });
        }
        logger.error('Error al crear sitio:', error);
        throw error;
    }
}));
/**
 * Actualiza un sitio existente
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
const updateSite = tryCatch((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { nombre, direccion, localidad, provincia, coordenadas } = req.body;
    // Construir el objeto para actualizar
    const updateData = {};
    if (nombre)
        updateData.Site = nombre;
    if (direccion)
        updateData.Direccion = direccion;
    if (localidad)
        updateData.Localidad = localidad;
    if (provincia)
        updateData.Provincia = provincia;
    // Convertir coordenadas al formato GeoJSON si existen
    if (coordenadas) {
        updateData.location = {
            type: 'Point',
            coordinates: [
                parseFloat(coordenadas.lng),
                parseFloat(coordenadas.lat)
            ]
        };
    }
    const siteActualizado = yield Site.findByIdAndUpdate(id, updateData, { new: true });
    if (!siteActualizado) {
        return res.status(404).json({
            success: false,
            message: 'Sitio no encontrado'
        });
    }
    logger.debug(`Sitio actualizado: ${id}`);
    return res.json({
        success: true,
        message: 'Sitio actualizado exitosamente',
        data: siteActualizado
    });
}));
/**
 * Elimina un sitio
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
const deleteSite = tryCatch((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Verificar dependencias antes de eliminar (opcional)
    // Aquí se podría verificar si hay tramos u otras entidades que usen este sitio
    const siteEliminado = yield Site.findByIdAndDelete(id);
    if (!siteEliminado) {
        return res.status(404).json({
            success: false,
            message: 'Sitio no encontrado'
        });
    }
    logger.debug(`Sitio eliminado: ${id}`);
    return res.json({
        success: true,
        message: 'Sitio eliminado exitosamente'
    });
}));
/**
 * Geocodifica una dirección
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
const geocodeDireccion = tryCatch((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { direccion } = req.body;
    if (!direccion) {
        throw new ValidationError('Dirección requerida');
    }
    // Aquí se implementaría la lógica de geocodificación
    // Normalmente se usaría un servicio externo como Google Maps, Mapbox, etc.
    // Este es un ejemplo simulado
    logger.debug(`Geocodificando dirección: ${direccion}`);
    // Coordenadas simuladas para demostración
    const coordenadas = {
        lat: -34.603722 + (Math.random() * 0.1),
        lng: -58.381592 + (Math.random() * 0.1)
    };
    return res.json({
        success: true,
        data: {
            direccion,
            coordenadas
        }
    });
}));
// Función de utilidad para crear un retraso
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
/**
 * Reprocesa las direcciones de todos los sitios de un cliente utilizando sus coordenadas.
 */
const reprocessAddressesByCliente = tryCatch((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { cliente } = req.params;
    let actualizados = 0;
    let fallidos = 0;
    const erroresDetallados = [];
    try {
        logger.info(`Iniciando reprocesamiento de direcciones para cliente: ${cliente}`);
        // Buscar todos los sitios del cliente que tengan coordenadas
        // Adaptado para buscar en 'location.coordinates' (GeoJSON)
        const sites = yield Site.find({
            Cliente: cliente,
            'location.coordinates': { $exists: true, $ne: [] }
        });
        if (!sites || sites.length === 0) {
            logger.warn(`No se encontraron sitios con coordenadas para el cliente: ${cliente}`);
            return res.status(404).json({ message: 'No se encontraron sitios con coordenadas para este cliente.' });
        }
        logger.info(`Reprocesando ${sites.length} sitios para el cliente: ${cliente}`);
        // Iterar sobre cada sitio y obtener la dirección
        for (const site of sites) {
            try {
                // Extraer coordenadas del formato GeoJSON
                if (!site.location || !Array.isArray(site.location.coordinates) || site.location.coordinates.length < 2) {
                    fallidos++;
                    erroresDetallados.push(`Sitio ${site.Site} (${site._id}) no tiene coordenadas válidas.`);
                    continue;
                }
                const [lng, lat] = site.location.coordinates; // Nota: GeoJSON es [lng, lat]
                // Llamar al servicio de geocodificación inversa
                const addressData = yield getAddressFromCoords(lat, lng);
                // Actualizar el sitio si se obtuvo información válida
                if (addressData) {
                    site.Direccion = addressData.direccion || site.Direccion; // Mantener si no hay nueva
                    site.Localidad = addressData.localidad || site.Localidad;
                    site.Provincia = addressData.provincia || site.Provincia;
                    yield site.save();
                    actualizados++;
                    logger.debug(`Sitio ${site.Site} (${site._id}) actualizado.`);
                }
                else {
                    fallidos++;
                    erroresDetallados.push(`No se pudo obtener dirección para sitio ${site.Site} (${site._id}) con coords ${lat},${lng}.`);
                    logger.warn(`Fallo al geocodificar sitio ${site.Site} (${site._id})`);
                }
                // ¡Importante! Añadir retraso para no saturar el servicio de geocodificación
                yield delay(1000); // Esperar 1 segundo entre llamadas
            }
            catch (error) {
                fallidos++;
                const errorMsg = `Error procesando sitio ${site.Site} (${site._id}): ${error.message}`;
                logger.error(errorMsg, error);
                erroresDetallados.push(errorMsg);
                // Continuar con el siguiente sitio aunque uno falle
                yield delay(1000); // Esperar incluso si hay error
            }
        }
        logger.info(`Reprocesamiento para cliente ${cliente} completado. Actualizados: ${actualizados}, Fallidos: ${fallidos}`);
        const responseMessage = `Reprocesamiento completado. Sitios actualizados: ${actualizados}. Sitios fallidos: ${fallidos}.`;
        if (fallidos > 0) {
            return res.status(207).json({
                message: responseMessage,
                actualizados,
                fallidos,
                detalles_error: erroresDetallados
            });
        }
        else {
            return res.status(200).json({
                message: responseMessage,
                actualizados,
                fallidos
            });
        }
    }
    catch (error) {
        logger.error(`Error general durante el reprocesamiento para cliente ${cliente}: ${error.message}`, error);
        return res.status(500).json({ message: 'Error interno del servidor durante el reprocesamiento.', error: error.message });
    }
}));
// Función para creación masiva (usada por la importación)
const createSitesBulk = (sitesData_1, ...args_1) => __awaiter(void 0, [sitesData_1, ...args_1], void 0, function* (sitesData, options = {}) {
    var _a;
    const session = options.session;
    let insertados = 0;
    const errores = [];
    if (!Array.isArray(sitesData) || sitesData.length === 0) {
        return { success: false, insertados: 0, errores: [{ message: 'No site data provided for bulk creation.' }] };
    }
    // Pre-procesar datos para asegurar formato correcto del modelo Mongoose
    const sitesToInsert = sitesData.map((site, index) => {
        var _a, _b, _c, _d;
        // Validar datos esenciales
        if (!site.Site || !((_b = (_a = site.location) === null || _a === void 0 ? void 0 : _a.coordinates) === null || _b === void 0 ? void 0 : _b[0]) || !((_d = (_c = site.location) === null || _c === void 0 ? void 0 : _c.coordinates) === null || _d === void 0 ? void 0 : _d[1])) {
            errores.push({ index, message: 'Faltan campos requeridos (Site, Longitud, Latitud)', data: site });
            return null; // Marcar para filtrar
        }
        if (isNaN(site.location.coordinates[0]) || isNaN(site.location.coordinates[1])) {
            errores.push({ index, message: 'Coordenadas inválidas', data: site });
            return null;
        }
        return {
            Site: site.Site, // Ya viene mapeado desde el controlador de viaje
            Cliente: site.Cliente, // El cliente debería venir resuelto o ser validado aquí? Por ahora lo aceptamos.
            Codigo: site.Codigo,
            Direccion: site.Direccion,
            Localidad: site.Localidad,
            Provincia: site.Provincia,
            location: {
                type: 'Point',
                coordinates: [site.location.coordinates[0], site.location.coordinates[1]]
            }
            // Añadir campos por defecto si son necesarios
        };
    }).filter(site => site !== null); // Filtrar los nulos por errores de validación previa
    if (sitesToInsert.length === 0 && errores.length > 0) {
        return { success: false, insertados: 0, errores };
    }
    if (sitesToInsert.length === 0) {
        return { success: false, insertados: 0, errores: [{ message: 'No valid site data left after filtering.' }] };
    }
    try {
        // Usar insertMany para eficiencia. ordered: false permite continuar si uno falla.
        const result = yield Site.insertMany(sitesToInsert, { session, ordered: false });
        insertados = result.length;
        logger.info(`[createSitesBulk] Insertados ${insertados} sitios correctamente.`);
    }
    catch (error) {
        logger.error('[createSitesBulk] Error durante insertMany:', error);
        // Analizar el error de bulkWrite para identificar fallos específicos
        if (error.name === 'MongoBulkWriteError' && error.writeErrors) {
            error.writeErrors.forEach(err => {
                const failedData = sitesToInsert[err.index];
                errores.push({
                    index: err.index,
                    message: `Error al insertar sitio ${failedData === null || failedData === void 0 ? void 0 : failedData.Site}: ${err.errmsg}`,
                    code: err.code,
                    data: failedData
                });
            });
            // Los que no dieron error se insertaron si ordered: false
            insertados = ((_a = error.result) === null || _a === void 0 ? void 0 : _a.nInserted) || (sitesToInsert.length - error.writeErrors.length);
            logger.warn(`[createSitesBulk] Completado con ${errores.length} errores. Insertados: ${insertados}`);
        }
        else {
            // Error general, no se insertó nada o error inesperado
            errores.push({ message: `Error inesperado en bulk create: ${error.message}` });
            insertados = 0; // Asumir que nada se insertó
        }
    }
    return {
        success: errores.length === 0,
        insertados,
        errores
    };
});
// Exportar todas las funciones del controlador
module.exports = {
    getAllSites,
    getSiteById,
    getSitesByCliente,
    createSite,
    updateSite,
    deleteSite,
    geocodeDireccion,
    reprocessAddressesByCliente,
    bulkDeleteSites,
    createSitesBulk
};
//# sourceMappingURL=site.controller.js.map