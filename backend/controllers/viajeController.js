const Viaje = require('../models/Viaje');
const logger = require('../utils/logger');
const Cliente = require('../models/Cliente');

exports.getViajes = async (req, res) => {
    try {
        logger.debug('Obteniendo lista de viajes');
        
        // Parámetros de paginación
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20; // Límite por defecto
        const skip = (page - 1) * limit;
        
        // Contar el total de viajes para la metadata
        const totalViajes = await Viaje.countDocuments();
        
        // Obtener viajes con paginación
        const viajes = await Viaje.find()
                               .sort({ fecha: -1 })
                               .skip(skip)
                               .limit(limit);
                               
        logger.debug(`${viajes.length} viajes encontrados (página ${page} de ${Math.ceil(totalViajes / limit)})`);
        
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

        // Extraer todos los DTs para verificación de duplicados en una sola consulta
        const allDts = viajes.map(v => v.dt);
        
        // Verificar duplicados en la base de datos en una sola consulta
        const dtsExistentes = await Viaje.find({
            cliente,
            dt: { $in: allDts }
        }).select('dt').lean();
        
        // Crear un Set para búsqueda rápida
        const dtsExistentesSet = new Set(dtsExistentes.map(v => v.dt));
        
        // Array para almacenar los viajes válidos a crear
        const viajesValidos = [];
        
        // Validar todos los viajes antes de insertar
        for (let i = 0; i < viajes.length; i++) {
            try {
                const viajeData = viajes[i];

                // Verificar si el DT ya existe
                if (dtsExistentesSet.has(viajeData.dt)) {
                    throw new Error(`El DT ${viajeData.dt} ya existe para este cliente`);
                }

                // Crear el objeto viaje para inserción masiva
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

                // Agregar al array de viajes válidos
                viajesValidos.push(viajeObj);

            } catch (error) {
                logger.error(`Error validando viaje #${i + 1}:`, error);
                resultados.errores.push({
                    indice: i,
                    dt: viajes[i].dt,
                    error: error.message
                });
            }
        }
        
        // Insertar todos los viajes válidos en una sola operación
        if (viajesValidos.length > 0) {
            try {
                const viajesInsertados = await Viaje.insertMany(viajesValidos, { 
                    ordered: false // Continuar aunque haya errores en algunos documentos
                });
                resultados.exitosos = viajesInsertados.length;
            } catch (bulkError) {
                // Manejo de errores en la inserción masiva
                logger.error('Error en inserción masiva:', bulkError);
                
                // Si hay algún viaje insertado a pesar del error
                if (bulkError.insertedDocs && bulkError.insertedDocs.length > 0) {
                    resultados.exitosos = bulkError.insertedDocs.length;
                }
                
                // Si hay errores específicos de duplicados no detectados anteriormente
                if (bulkError.writeErrors) {
                    for (const err of bulkError.writeErrors) {
                        if (err.err && err.err.op) {
                            resultados.errores.push({
                                indice: viajes.findIndex(v => v.dt === err.err.op.dt),
                                dt: err.err.op.dt,
                                error: 'Error en la inserción: ' + (err.err.errmsg || 'Documento duplicado o inválido')
                            });
                        }
                    }
                }
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
