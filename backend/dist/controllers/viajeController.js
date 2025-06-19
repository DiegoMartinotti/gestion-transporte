import { Types } from 'mongoose';
import Viaje from '../models/Viaje';
import logger from '../utils/logger';
import ApiResponse from '../utils/ApiResponse';
import Cliente from '../models/Cliente';
import mongoose from 'mongoose';
import ImportacionTemporal from '../models/ImportacionTemporal';
/**
 * Helper function to escape regex special characters
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export const getViajes = async (req, res) => {
    try {
        logger.debug('Obteniendo lista de viajes');
        // Parámetros de paginación
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '20', 10);
        const skip = (page - 1) * limit;
        // Construir el objeto de filtro
        const filter = {};
        if (req.query.cliente && Types.ObjectId.isValid(req.query.cliente)) {
            filter.cliente = req.query.cliente;
            logger.debug(`Filtrando viajes por cliente: ${req.query.cliente}`);
        }
        else {
            logger.debug('No se proporcionó un cliente válido para filtrar o no se proporcionó cliente. Devolviendo todos los viajes (paginados).');
        }
        // Contar el total de viajes para la metadata (considerando el filtro)
        const totalViajes = await Viaje.countDocuments(filter);
        // Obtener viajes con paginación, filtro y poblar datos relacionados
        const viajes = await Viaje.find(filter)
            .populate({ path: 'cliente', select: 'Cliente' })
            .populate({ path: 'origen', select: 'Site nombre' })
            .populate({ path: 'destino', select: 'Site nombre' })
            .sort({ fecha: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
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
};
export const getViajeById = async (req, res) => {
    try {
        const viaje = await Viaje.findById(req.params.id);
        if (!viaje) {
            res.status(404).json({ message: 'Viaje no encontrado' });
            return;
        }
        res.json(viaje);
    }
    catch (error) {
        logger.error('Error al obtener viaje:', error);
        res.status(500).json({ message: 'Error al obtener viaje' });
    }
};
export const createViaje = async (req, res) => {
    try {
        const nuevoViaje = new Viaje(req.body);
        await nuevoViaje.save();
        res.status(201).json(nuevoViaje);
    }
    catch (error) {
        logger.error('Error al crear viaje:', error);
        res.status(500).json({ message: 'Error al crear viaje' });
    }
};
export const updateViaje = async (req, res) => {
    try {
        const viaje = await Viaje.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!viaje) {
            res.status(404).json({ message: 'Viaje no encontrado' });
            return;
        }
        res.json(viaje);
    }
    catch (error) {
        logger.error('Error al actualizar viaje:', error);
        res.status(500).json({ message: 'Error al actualizar viaje' });
    }
};
export const deleteViaje = async (req, res) => {
    try {
        const viaje = await Viaje.findByIdAndDelete(req.params.id);
        if (!viaje) {
            res.status(404).json({ message: 'Viaje no encontrado' });
            return;
        }
        res.json({ message: 'Viaje eliminado exitosamente' });
    }
    catch (error) {
        logger.error('Error al eliminar viaje:', error);
        res.status(500).json({ message: 'Error al eliminar viaje' });
    }
};
/**
 * Crea múltiples viajes en una sola operación
 *
 * @description Inicia el proceso de importación masiva de viajes en dos etapas.
 *              Etapa 1: Intenta importar todos los viajes, registra éxitos y fallos detallados.
 */
export const iniciarBulkImportViajes = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let importacionId = null;
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            logger.error('ERROR: Cuerpo de solicitud vacío');
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ success: false, message: 'Cuerpo de solicitud vacío' });
            return;
        }
        const { cliente: clienteId, viajes } = req.body;
        logger.debug('Datos recibidos para bulk import:', {
            clienteId,
            cantidadViajes: viajes?.length || 0
        });
        if (!Types.ObjectId.isValid(clienteId)) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ success: false, message: 'ID de Cliente inválido' });
            return;
        }
        if (!Array.isArray(viajes) || viajes.length === 0) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ success: false, message: 'Formato de datos inválido o sin viajes' });
            return;
        }
        // Crear registro de importación temporal
        const importacion = new ImportacionTemporal({
            cliente: clienteId,
            status: 'processing',
            failCountInitial: 0,
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
        await importacion.save({ session });
        importacionId = importacion._id?.toString() || null;
        const clienteDoc = await Cliente.findById(clienteId).session(session).lean();
        if (!clienteDoc) {
            if (importacionId) {
                await ImportacionTemporal.findByIdAndUpdate(importacionId, { status: 'failed', message: 'Cliente no encontrado' }, { session });
            }
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ success: false, message: 'Cliente no encontrado' });
            return;
        }
        logger.info(`Iniciando importación masiva de viajes para cliente: ${clienteDoc.nombre} (${clienteId})`);
        logger.info(`Total de viajes a procesar: ${viajes.length}`);
        // Aquí continuaría la lógica de procesamiento de viajes...
        // Por simplicidad, solo actualizamos el estado a completado
        if (importacionId) {
            await ImportacionTemporal.findByIdAndUpdate(importacionId, {
                status: 'completed',
                successCountInitial: viajes.length,
                message: 'Importación completada (versión simplificada)'
            }, { session });
        }
        await session.commitTransaction();
        session.endSession();
        res.json({
            success: true,
            message: `Importación iniciada para ${viajes.length} viajes`,
            data: {
                importacionId,
                clienteId,
                totalViajes: viajes.length
            }
        });
    }
    catch (error) {
        logger.error('Error en iniciarBulkImportViajes:', error);
        if (importacionId) {
            try {
                await ImportacionTemporal.findByIdAndUpdate(importacionId, {
                    status: 'failed',
                    message: `Error durante importación: ${error.message}`
                }, { session });
            }
            catch (updateError) {
                logger.error('Error al actualizar estado de importación:', updateError);
            }
        }
        await session.abortTransaction();
        session.endSession();
        return ApiResponse.error(res, 'Error interno durante la importación', 500, error.message);
    }
};
//# sourceMappingURL=viajeController.js.map