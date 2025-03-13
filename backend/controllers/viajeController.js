const Viaje = require('../models/Viaje');
const logger = require('../utils/logger');
const Cliente = require('../models/Cliente');

exports.getViajes = async (req, res) => {
    try {
        logger.debug('Obteniendo lista de viajes');
        const viajes = await Viaje.find().sort({ fecha: -1 });
        logger.debug(`${viajes.length} viajes encontrados`);
        res.json(viajes);
    } catch (error) {
        logger.error('Error al obtener viajes:', error);
        res.status(500).json({ message: 'Error al obtener viajes' });
    }
};

exports.getViajeById = async (req, res) => {
    try {
        const viaje = await Viaje.findById(req.params.id);
        if (!viaje) {
            return res.status(404).json({ message: 'Viaje no encontrado' });
        }
        res.json(viaje);
    } catch (error) {
        logger.error('Error al obtener viaje:', error);
        res.status(500).json({ message: 'Error al obtener viaje' });
    }
};

exports.createViaje = async (req, res) => {
    try {
        const nuevoViaje = new Viaje(req.body);
        await nuevoViaje.save();
        res.status(201).json(nuevoViaje);
    } catch (error) {
        logger.error('Error al crear viaje:', error);
        res.status(500).json({ message: 'Error al crear viaje' });
    }
};

exports.updateViaje = async (req, res) => {
    try {
        const viaje = await Viaje.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!viaje) {
            return res.status(404).json({ message: 'Viaje no encontrado' });
        }
        res.json(viaje);
    } catch (error) {
        logger.error('Error al actualizar viaje:', error);
        res.status(500).json({ message: 'Error al actualizar viaje' });
    }
};

exports.deleteViaje = async (req, res) => {
    try {
        const viaje = await Viaje.findByIdAndDelete(req.params.id);
        if (!viaje) {
            return res.status(404).json({ message: 'Viaje no encontrado' });
        }
        res.json({ message: 'Viaje eliminado exitosamente' });
    } catch (error) {
        logger.error('Error al eliminar viaje:', error);
        res.status(500).json({ message: 'Error al eliminar viaje' });
    }
};

/**
 * Crea múltiples viajes en una sola operación
 * 
 * @async
 * @function bulkCreateViajes
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.body - Cuerpo de la solicitud
 * @param {string} req.body.cliente - ID del cliente
 * @param {Array<Object>} req.body.viajes - Array de objetos con datos de viajes
 * @returns {Promise<Object>} Resultado de la operación con viajes creados y errores
 */
exports.bulkCreateViajes = async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            logger.error('ERROR: Cuerpo de solicitud vacío');
            return res.status(400).json({
                success: false,
                message: 'Cuerpo de solicitud vacío',
                headers: {
                    contentType: req.headers['content-type'],
                    contentLength: req.headers['content-length']
                }
            });
        }

        const { cliente, viajes } = req.body;
        
        logger.debug('Datos recibidos:', {
            clientePresente: !!cliente,
            viajesPresente: !!viajes,
            viajesLength: viajes?.length || 0
        });

        if (!Array.isArray(viajes)) {
            logger.error('Datos inválidos recibidos:', viajes);
            return res.status(400).json({ 
                success: false,
                message: 'El formato de datos es inválido',
                received: typeof viajes
            });
        }

        if (viajes.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se recibieron viajes para importar'
            });
        }

        const resultados = {
            exitosos: 0,
            errores: [],
            total: viajes.length,
        };

        // Verificar que el cliente existe
        const clienteDoc = await Cliente.findById(cliente);
        if (!clienteDoc) {
            throw new Error('Cliente no encontrado');
        }

        // Procesar cada viaje
        for (let i = 0; i < viajes.length; i++) {
            try {
                const viajeData = viajes[i];

                // Validar que el DT no esté duplicado para este cliente
                const dtExistente = await Viaje.findOne({
                    cliente,
                    dt: viajeData.dt
                });

                if (dtExistente) {
                    throw new Error(`El DT ${viajeData.dt} ya existe para este cliente`);
                }

                // Crear el objeto viaje
                const viajeObj = {
                    cliente,
                    fecha: new Date(viajeData.fecha),
                    origen: viajeData.origen,
                    destino: viajeData.destino,
                    tipoTramo: viajeData.tipoTramo || 'TRMC',
                    tipoUnidad: viajeData.tipoUnidad || 'Sider',
                    paletas: Number(viajeData.paletas) || 0,
                    dt: viajeData.dt,
                    estado: viajeData.estado || 'Pendiente',
                    observaciones: viajeData.observaciones || ''
                };

                // Crear y guardar el viaje
                const nuevoViaje = new Viaje(viajeObj);
                await nuevoViaje.save();

                resultados.exitosos++;

            } catch (error) {
                logger.error(`Error procesando viaje #${i + 1}:`, error);
                resultados.errores.push({
                    indice: i,
                    dt: viajes[i].dt,
                    error: error.message
                });
            }
        }

        // Enviar respuesta
        res.json({
            success: true,
            mensaje: `Importación completada: ${resultados.exitosos} de ${resultados.total} viajes creados`,
            exitosos: resultados.exitosos,
            errores: resultados.errores,
            total: resultados.total,
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
