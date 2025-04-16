const Viaje = require('../models/Viaje');
const logger = require('../utils/logger');
const Cliente = require('../models/Cliente');
const Personal = require('../models/Personal');
const Vehiculo = require('../models/Vehiculo');
const Site = require('../models/Site');
const Tramo = require('../models/Tramo');
const mongoose = require('mongoose');

// Helper function to escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

exports.getViajes = async (req, res) => {
    try {
        logger.debug('Obteniendo lista de viajes');
        
        // Parámetros de paginación
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20; // Límite por defecto
        const skip = (page - 1) * limit;
        
        // Contar el total de viajes para la metadata
        const totalViajes = await Viaje.countDocuments();
        
        // Obtener viajes con paginación y poblar datos del cliente
        const viajes = await Viaje.find()
                                .populate('cliente') // Añadido para incluir datos del cliente
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
 * @param {Array<Object>} req.body.viajes - Array de objetos con datos de viajes (formato nuevo)
 * @returns {Promise<Object>} Resultado de la operación con viajes creados y errores
 */
exports.bulkCreateViajes = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            logger.error('ERROR: Cuerpo de solicitud vacío');
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Cuerpo de solicitud vacío' });
        }

        const { cliente: clienteId, viajes } = req.body;
        
        logger.debug('Datos recibidos para bulk import:', {
            clienteId,
            cantidadViajes: viajes?.length || 0
        });

        if (!mongoose.Types.ObjectId.isValid(clienteId)) {
             await session.abortTransaction();
             session.endSession();
             return res.status(400).json({ success: false, message: 'ID de Cliente inválido' });
        }

        if (!Array.isArray(viajes) || viajes.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Formato de datos inválido o sin viajes' });
        }

        const resultados = {
            exitosos: 0,
            errores: [],
            total: viajes.length,
        };

        const clienteDoc = await Cliente.findById(clienteId).lean();
        if (!clienteDoc) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: `Cliente con ID ${clienteId} no encontrado` });
        }
        const clienteNombre = clienteDoc.Cliente;

        const allDtSet = new Set(viajes.map(v => String(v.dt || '').trim()).filter(dt => dt));
        const allChoferIdentifiers = [...new Set(viajes.map(v => String(v.chofer || '').trim()).filter(c => c))];
        const allPatentesRaw = viajes.flatMap(v => typeof v.vehiculo === 'string' ? v.vehiculo.split(',') : [])
                                  .map(p => String(p || '').trim().toUpperCase()).filter(p => p);
        const allPatentes = [...new Set(allPatentesRaw)];
        const allSiteNombresRaw = viajes.flatMap(v => [String(v.origenNombre || '').trim(), String(v.destinoNombre || '').trim()])
                                     .filter(n => n);
        const allSiteNombres = [...new Set(allSiteNombresRaw)];
        const allSiteNombresRegex = allSiteNombres.map(n => new RegExp(`^${escapeRegExp(n)}$`, 'i')); // Regex exacto case-insensitive

        const dtsExistentes = await Viaje.find({ cliente: clienteId, dt: { $in: [...allDtSet] } }).select('dt').lean();
        const dtsExistentesSet = new Set(dtsExistentes.map(v => v.dt));

        const choferesDocs = await Personal.find({ 
            activo: true, // Asegurar que solo buscamos activos
            $or: [
                { legajo: { $in: allChoferIdentifiers } }, 
                { dni: { $in: allChoferIdentifiers } }
            ]
        }).lean();
        const choferMap = new Map();
        choferesDocs.forEach(c => {
            if (c.legajo) {
                 choferMap.set(String(c.legajo).trim(), c); 
            }
            if (c.dni) {
                 choferMap.set(String(c.dni).trim(), c); 
            }
        });

        const vehiculosDocs = await Vehiculo.find({ dominio: { $in: allPatentes } }).lean();
        const vehiculoMap = new Map(vehiculosDocs.map(v => [String(v.dominio).trim().toUpperCase(), v]));

        const sitesDocs = await Site.find({
             $or: [
                 { nombre: { $in: allSiteNombresRegex } },
                 { Site: { $in: allSiteNombresRegex } } // Buscar también en campo 'Site'
             ]
        }).lean();
        const siteMap = new Map();
        sitesDocs.forEach(s => {
            const keySite = String(s.Site || '').trim().toLowerCase();
            const keyNombre = String(s.nombre || '').trim().toLowerCase();
            // Si el campo Site existe y no está vacío, usarlo como clave principal
            if (keySite) {
                 siteMap.set(keySite, s);
            }
            // Añadir también clave por nombre si es diferente y no vacía (o si Site no existía)
            if (keyNombre && keyNombre !== keySite) {
                siteMap.set(keyNombre, s);
            }
            // Si solo existe nombre
            else if (keyNombre && !keySite) {
                siteMap.set(keyNombre, s);
            }
        });

        logger.debug('Datos pre-cargados:', {
            dtsExistentes: dtsExistentesSet.size,
            choferesEncontradosMapa: choferMap.size, // Tamaño del mapa
            vehiculosEncontradosMapa: vehiculoMap.size,
            sitesEncontradosMapa: siteMap.size
        });

        for (let i = 0; i < viajes.length; i++) {
            const viajeData = viajes[i];
            const indiceOriginal = i;
            let origenId = null;
            let destinoId = null;
            let choferId = null;
            let vehiculosParaViaje = [];
            let tramoSeleccionado = null;

            try {
                const dtNormalizado = String(viajeData.dt || '').trim();
                logger.debug(`Procesando viaje #${indiceOriginal + 1} con DT: ${dtNormalizado}`);

                if (!dtNormalizado) {
                    throw new Error('El campo DT es requerido');
                }
                if (dtsExistentesSet.has(dtNormalizado)) {
                    throw new Error(`El DT ${dtNormalizado} ya existe para este cliente`);
                }

                if (!viajeData.fecha || isNaN(new Date(viajeData.fecha).getTime())) {
                    throw new Error(`Fecha inválida: ${viajeData.fecha}`);
                }
                const fechaViaje = new Date(viajeData.fecha);

                if (!viajeData.origenNombre || !viajeData.destinoNombre) {
                    throw new Error('Los campos Origen y Destino son requeridos');
                }
                const origenNombreNorm = String(viajeData.origenNombre || '').trim().toLowerCase();
                const destinoNombreNorm = String(viajeData.destinoNombre || '').trim().toLowerCase();
                if (!origenNombreNorm || !destinoNombreNorm) {
                    throw new Error('Los campos Origen y Destino son requeridos');
                }
                const origenDoc = siteMap.get(origenNombreNorm);
                const destinoDoc = siteMap.get(destinoNombreNorm);
                if (!origenDoc) {
                    throw new Error(`Sitio de Origen '${viajeData.origenNombre}' no encontrado o inconsistente con hoja Sitios.`);
                }
                if (!destinoDoc) {
                    throw new Error(`Sitio de Destino '${viajeData.destinoNombre}' no encontrado o inconsistente con hoja Sitios.`);
                }
                origenId = origenDoc._id;
                destinoId = destinoDoc._id;

                if (!viajeData.chofer) {
                    throw new Error('El campo Chofer (Legajo/DNI) es requerido');
                }
                const choferIdentifierNorm = String(viajeData.chofer || '').trim();
                if (!choferIdentifierNorm) {
                    throw new Error('El campo Chofer (Legajo/DNI) es requerido');
                }
                const choferDoc = choferMap.get(choferIdentifierNorm);
                if (!choferDoc) {
                    throw new Error(`Chofer con identificador '${viajeData.chofer}' no encontrado, inactivo o inconsistente con hoja Choferes.`);
                }
                choferId = choferDoc._id;

                if (!viajeData.vehiculo || typeof viajeData.vehiculo !== 'string' || viajeData.vehiculo.trim() === '') {
                    throw new Error('El campo Vehículos (patentes) es requerido y no puede estar vacío');
                }
                const vehiculoInput = String(viajeData.vehiculo || '').trim();
                if (!vehiculoInput) {
                    throw new Error('El campo Vehículos (patentes) es requerido y no puede estar vacío');
                }
                const patentesArrayNorm = vehiculoInput.split(',').map(p => String(p || '').trim().toUpperCase()).filter(p => p);
                if (patentesArrayNorm.length === 0) {
                     throw new Error('Debe ingresar al menos una patente válida en Vehículos');
                }
                
                vehiculosParaViaje = [];
                for (let j = 0; j < patentesArrayNorm.length; j++) {
                    const patenteNorm = patentesArrayNorm[j];
                    const vehiculoDoc = vehiculoMap.get(patenteNorm);
                    if (!vehiculoDoc) {
                        throw new Error(`Vehículo con patente '${patenteNorm}' no encontrado o inconsistente con hoja Vehiculos.`);
                    }
                    vehiculosParaViaje.push({ 
                        vehiculo: vehiculoDoc._id, 
                        posicion: j + 1
                    });
                }

                // --- Búsqueda de Tramo y determinación de tipoTramo --- 
                logger.debug('Buscando Tramos (SIN filtro de fecha inicial) con:', { clienteId, origenId, destinoId });

                // 1. Encontrar TODOS los tramos que coincidan con cliente (por NOMBRE), origen (por ID), destino (por ID)
                // 1. Encontrar TODOS los tramos que coincidan con cliente (por ID), origen (por ID), destino (por ID)
                const tramosCoincidentes = await Tramo.find({
                    cliente: clienteId, // Corregido: Usar ObjectId del cliente
                    origen: origenId,
                    destino: destinoId
                }).lean(); // Usamos lean() para mejor rendimiento

                logger.debug(`Tramos coincidentes encontrados: ${tramosCoincidentes.length}`);

                if (!tramosCoincidentes || tramosCoincidentes.length === 0) {
                    throw new Error(`No se encontró ningún tramo (principal o histórico) para Cliente ID: ${clienteId}, Origen: ${viajeData.origenNombre}, Destino: ${viajeData.destinoNombre}`);
                }

                // 2. Recopilar todas las tarifas vigentes de TODOS los tramos encontrados para la fecha del viaje
                let todasLasTarifasVigentes = [];
                const fechaViajeDate = new Date(fechaViaje);
                if (isNaN(fechaViajeDate)) {
                    throw new Error(`Fecha de viaje inválida: ${viajeData.fecha}`);
                }

                tramosCoincidentes.forEach(tramoDoc => {
                    if (!tramoDoc || !Array.isArray(tramoDoc.tarifasHistoricas) || tramoDoc.tarifasHistoricas.length === 0) {
                        logger.warn(`Tramo ID: ${tramoDoc?._id} no tiene tarifas históricas o la estructura es inválida. Saltando este tramo.`);
                        return; // Saltar este tramo si no tiene tarifas o es inválido
                    }

                    const tarifasVigentesDelTramo = tramoDoc.tarifasHistoricas.filter(tarifa => {
                        let vigenciaDesdeDate, vigenciaHastaDate;
                        try {
                            // Asegurarse que las fechas existen y son válidas antes de crear el objeto Date
                            if (!tarifa.vigenciaDesde || !tarifa.vigenciaHasta) {
                                throw new Error('Fechas de vigencia faltantes');
                            }
                            vigenciaDesdeDate = new Date(tarifa.vigenciaDesde);
                            vigenciaHastaDate = new Date(tarifa.vigenciaHasta);
                            if (isNaN(vigenciaDesdeDate) || isNaN(vigenciaHastaDate)) {
                                throw new Error('Fechas de vigencia inválidas');
                            }
                        } catch (e) {
                            logger.warn(`Tarifa histórica en tramo ${tramoDoc._id} con fechas inválidas/faltantes: ${e.message}`, tarifa);
                            return false; // Ignorar tarifa con fechas inválidas
                        }

                        // Comparar objetos Date
                        return vigenciaDesdeDate <= fechaViajeDate && vigenciaHastaDate >= fechaViajeDate;
                    });
                    
                    // Agregar las tarifas vigentes de este tramo a la lista general
                    todasLasTarifasVigentes.push(...tarifasVigentesDelTramo);
                });


                logger.debug(`Total de tarifas vigentes encontradas en todos los tramos (${todasLasTarifasVigentes.length}):`, todasLasTarifasVigentes);

                if (todasLasTarifasVigentes.length === 0) {
                    throw new Error(`No se encontró ninguna tarifa específica vigente en ninguno de los tramos coincidentes para la fecha: ${viajeData.fecha}`);
                }

                // 3. Encontrar la tarifa de MAYOR VALOR entre TODAS las vigentes
                let tarifaSeleccionada = null;
                let maxValorEncontrado = -Infinity;

                for (const currentTarifa of todasLasTarifasVigentes) {
                    const currentValor = Number(currentTarifa.valor);
                    // Verificar si el valor es un número válido y si es mayor que el máximo actual
                    if (!isNaN(currentValor) && currentValor > maxValorEncontrado) {
                         // Verificar también que el 'tipo' exista en la tarifa
                         if (typeof currentTarifa.tipo === 'undefined' || currentTarifa.tipo === null || currentTarifa.tipo === '') {
                             logger.warn(`Tarifa vigente (valor: ${currentValor}) encontrada sin tipo definido. Saltando esta tarifa.`);
                             continue; // Saltar si no tiene tipo definido
                         }
                         maxValorEncontrado = currentValor;
                         tarifaSeleccionada = currentTarifa;
                    } else if (isNaN(currentValor)) {
                        logger.warn(`Tarifa histórica con valor inválido encontrada:`, currentTarifa);
                    }
                }


                logger.debug('Tarifa final seleccionada (mayor valor vigente de todos los tramos):', tarifaSeleccionada);

                if (!tarifaSeleccionada) {
                    // Este caso podría darse si todas las tarifas vigentes tienen valores inválidos o no tienen tipo
                     throw new Error(`No se pudo seleccionar una tarifa vigente válida (valores inválidos o sin tipo definido) para la fecha: ${viajeData.fecha}`);
                }
                // El tipo 'tipo' ya fue validado dentro del bucle

                // 4. Extraer el tipo de la tarifa seleccionada
                const tipoTramoFinal = tarifaSeleccionada.tipo;
                logger.debug('Tipo Tramo Final determinado:', tipoTramoFinal);

                // --- Creación y guardado del Viaje ---
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
                    estado: 'Pendiente'
                });

                const viajeGuardado = await viajeParaGuardar.save({ session });
                
                dtsExistentesSet.add(dtNormalizado);
                resultados.exitosos++;
                logger.info(`Viaje DT ${dtNormalizado} importado exitosamente.`);

            } catch (error) {
                logger.error(`Error procesando viaje #${indiceOriginal + 1} (DT: ${viajeData.dt}): ${error.message}`, error.stack);
                resultados.errores.push({
                    indice: indiceOriginal,
                    dt: viajeData.dt || `Fila ${indiceOriginal + 1}`,
                    origen: viajeData.origenNombre,
                    destino: viajeData.destinoNombre,
                    error: error.message || 'Error desconocido durante el procesamiento'
                });
            }
        }
        
        await session.commitTransaction();
        session.endSession();

        logger.info(`Importación bulk finalizada para cliente ${clienteId}. Exitosos: ${resultados.exitosos}, Errores: ${resultados.errores.length}`);

        res.status(resultados.errores.length > 0 ? 207 : 201).json({
            success: resultados.errores.length === 0,
            mensaje: `Importación completada: ${resultados.exitosos} de ${resultados.total} viajes procesados.`,
            exitosos: resultados.exitosos,
            errores: resultados.errores,
            total: resultados.total,
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.error('Error fatal durante la importación bulk de viajes:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor durante la importación.', 
            error: error.message 
        });
    }
};
