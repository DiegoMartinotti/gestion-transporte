const Tramo = require('../models/Tramo');
const Site = require('../models/Site');
const { format } = require('date-fns');
const { fechasSuperpuestas, generarTramoId, sonTramosIguales } = require('../utils/tramoValidator');

exports.getTramosByCliente = async (req, res) => {
    try {
        console.log('Buscando tramos para cliente:', req.params.cliente);
        
        const { cliente } = req.params;
        const tramos = await Tramo.find({ cliente })
            .populate('origen', 'Site location')
            .populate('destino', 'Site location')
            .sort({ 'origen.Site': 1, 'destino.Site': 1 });
        
        console.log(`Se encontraron ${tramos.length} tramos para cliente ${cliente}`);
        if(tramos.length > 0) {
            console.log('Primer tramo (ejemplo):', tramos[0]);
        }

        res.json({
            success: true,
            data: tramos
        });
    } catch (error) {
        console.error('Error al obtener tramos:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

exports.bulkCreateTramos = async (req, res) => {
    try {
        // Verificar si el cuerpo está llegando correctamente
        if (!req.body || Object.keys(req.body).length === 0) {
            console.error('ERROR: Cuerpo de solicitud vacío');
            return res.status(400).json({
                success: false,
                message: 'Cuerpo de solicitud vacío',
                headers: {
                    contentType: req.headers['content-type'],
                    contentLength: req.headers['content-length']
                }
            });
        }

        const { cliente, tramos } = req.body;
        
        console.log('Datos recibidos:', {
            clientePresente: !!cliente,
            tramosPresente: !!tramos,
            tramosLength: tramos?.length || 0
        });

        console.log('Recibiendo importación masiva:', { 
            cliente, 
            tramosCantidad: tramos?.length || 0,
            body: JSON.stringify(req.body).substring(0, 200) + '...' 
        });

        if (!Array.isArray(tramos)) {
            console.error('Datos inválidos recibidos:', tramos);
            return res.status(400).json({ 
                success: false,
                message: 'El formato de datos es inválido',
                received: typeof tramos
            });
        }

        if (tramos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se recibieron tramos para importar'
            });
        }

        // Verificar un tramo de ejemplo para debug
        console.log('Ejemplo de tramo recibido:', JSON.stringify(tramos[0]));

        const resultados = {
            exitosos: 0,
            errores: [],
            total: tramos.length,
        };

        // Primero, cargar todos los tramos existentes para ese cliente para hacer una comparación más eficiente
        const tramosExistentes = await Tramo.find({ cliente }).lean();
        console.log(`Encontrados ${tramosExistentes.length} tramos existentes para el cliente ${cliente}`);

        // Crear un mapa de tramos existentes para búsqueda eficiente
        const mapaExistentes = {};
        tramosExistentes.forEach(tramo => {
            const id = generarTramoId(tramo);
            console.log(`Registrando tramo existente con ID: ${id}`);
            if (!mapaExistentes[id]) {
                mapaExistentes[id] = [];
            }
            mapaExistentes[id].push(tramo);
            console.log(`Registrado existente: ${id} - ${tramo.tipo}`);
        });

        // Verificar posibles duplicados antes de intentar guardar
        for (let i = 0; i < tramos.length; i++) {
            try {
                const tramoData = tramos[i];
                // Validación básica con más información
                if (!tramoData.origen) {
                    throw new Error(`Origen no definido en tramo #${i+1}`);
                }

                if (!tramoData.destino) {
                    throw new Error(`Destino no definido en tramo #${i+1}`);
                }

                if (!tramoData.vigenciaDesde) {
                    throw new Error(`Fecha inicio vigencia no definida en tramo #${i+1}`);
                }

                if (!tramoData.vigenciaHasta) {
                    throw new Error(`Fecha fin vigencia no definida en tramo #${i+1}`);
                }

                // Asegurarse de que las fechas se procesan correctamente
                console.log(`Procesando fechas para tramo #${i+1}:`);
                console.log(`  Fecha desde original: ${tramoData.vigenciaDesde}`);
                console.log(`  Fecha hasta original: ${tramoData.vigenciaHasta}`);

                // Mejorar el procesamiento de fechas
                let fechaDesde = tramoData.vigenciaDesde;
                let fechaHasta = tramoData.vigenciaHasta;

                console.log(`Procesando fecha desde (tipo): ${typeof fechaDesde}`);
                console.log(`Fecha desde original: ${fechaDesde}`);

                // Si ya es un objeto Date, dejarlo como está
                if (!(fechaDesde instanceof Date)) {
                    try {
                        // Para formato ISO (2025-01-01T00:00:00.000Z)
                        if (typeof fechaDesde === 'string' && fechaDesde.includes('T')) {
                            fechaDesde = new Date(fechaDesde);
                            console.log(`Fecha ISO detectada y procesada: ${fechaDesde}`);
                        }
                        // Para formato DD/MM/YYYY
                        else if (typeof fechaDesde === 'string' && fechaDesde.includes('/')) {
                            const parts = fechaDesde.split('/');
                            if (parts.length === 3) {
                                // Crear fecha usando método Date.UTC para evitar problemas de zona horaria
                                // y asegurarnos que se guarde exactamente la fecha indicada
                                const year = parseInt(parts[2], 10);
                                const month = parseInt(parts[1], 10) - 1; // Los meses en JS van de 0-11
                                const day = parseInt(parts[0], 10);
                                fechaDesde = new Date(Date.UTC(year, month, day));
                                console.log(`Fecha DD/MM/YYYY procesada: ${fechaDesde}`);
                            } else {
                                fechaDesde = new Date(fechaDesde);
                            }
                        }
                        // Para formato YYYY-MM-DD sin hora
                        else if (typeof fechaDesde === 'string' && fechaDesde.includes('-') && !fechaDesde.includes('T')) {
                            fechaDesde = new Date(`${fechaDesde}T00:00:00.000Z`);
                            console.log(`Fecha YYYY-MM-DD procesada: ${fechaDesde}`);
                        }
                        // Cualquier otro formato
                        else if (typeof fechaDesde === 'string') {
                            fechaDesde = new Date(fechaDesde);
                            console.log(`Otro formato de fecha procesado: ${fechaDesde}`);
                        }
                    } catch (fechaError) {
                        console.error(`Error procesando fecha desde: ${fechaError}`);
                        throw new Error(`Error al procesar fecha de inicio: ${fechaError.message}`);
                    }
                }

                // Repetir el proceso para fechaHasta
                if (!(fechaHasta instanceof Date)) {
                    try {
                        // Para formato ISO (2025-01-01T00:00:00.000Z)
                        if (typeof fechaHasta === 'string' && fechaHasta.includes('T')) {
                            fechaHasta = new Date(fechaHasta);
                        }
                        // Para formato DD/MM/YYYY
                        else if (typeof fechaHasta === 'string' && fechaHasta.includes('/')) {
                            const parts = fechaHasta.split('/');
                            if (parts.length === 3) {
                                // Usar Date.UTC para crear fecha sin problemas de zona horaria
                                // Agregar 23:59:59.999 para que sea el final del día
                                const year = parseInt(parts[2], 10);
                                const month = parseInt(parts[1], 10) - 1; // Los meses en JS van de 0-11
                                const day = parseInt(parts[0], 10);
                                // Creamos la fecha a final del día para incluir todo el día de fin de vigencia
                                fechaHasta = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
                                console.log(`Fecha DD/MM/YYYY procesada hasta: ${fechaHasta}`);
                            } else {
                                fechaHasta = new Date(fechaHasta);
                            }
                        }
                        // Para formato YYYY-MM-DD sin hora
                        else if (typeof fechaHasta === 'string' && fechaHasta.includes('-') && !fechaHasta.includes('T')) {
                            fechaHasta = new Date(`${fechaHasta}T23:59:59.999Z`);
                        }
                        // Cualquier otro formato
                        else if (typeof fechaHasta === 'string') {
                            fechaHasta = new Date(fechaHasta);
                        }
                    } catch (fechaError) {
                        console.error(`Error procesando fecha hasta: ${fechaError}`);
                        throw new Error(`Error al procesar fecha de fin: ${fechaError.message}`);
                    }
                }

                console.log(`Fecha desde procesada final: ${fechaDesde}`);
                console.log(`Fecha hasta procesada final: ${fechaHasta}`);

                // Verificar que las fechas sean válidas DESPUÉS de procesarlas
                if (!(fechaDesde instanceof Date) || isNaN(fechaDesde.getTime())) {
                    console.error('Fecha inicio inválida después del procesamiento:', fechaDesde);
                    throw new Error(`La fecha de inicio no es válida después del procesamiento`);
                }
                if (!(fechaHasta instanceof Date) || isNaN(fechaHasta.getTime())) {
                    console.error('Fecha fin inválida después del procesamiento:', fechaHasta);
                    throw new Error(`La fecha de fin no es válida después del procesamiento`);
                }

                // Asegurarse que el tipo está normalizado
                if (tramoData.tipo) {
                    tramoData.tipo = tramoData.tipo.toUpperCase();
                } else {
                    tramoData.tipo = 'TRMC'; // Valor por defecto
                }
                console.log(`[IMPORT] Procesando tramo #${i+1} con tipo: ${tramoData.tipo}`);

                // Generar ID explícito para este tramo (incluye el tipo)
                let tramoId; // Declarar fuera del try para que esté disponible en todo el ámbito
                try {
                    tramoId = generarTramoId(tramoData);
                    console.log(`[IMPORT] Verificando tramo #${i+1}: ${tramoId}`);
                    console.log(`[IMPORT] Tipo: ${tramoData.tipo}, Método: ${tramoData.metodoCalculo || 'Palet'}`);
                    
                    // DEBUG: Verificar explícitamente que el ID incluye el tipo
                    if (!tramoId.includes(tramoData.tipo)) {
                        console.error(`[IMPORT] ⚠️ ERROR: El ID generado no contiene el tipo del tramo (${tramoData.tipo})`);
                    }
                    
                } catch (idError) {
                    console.error(`Error al generar ID para tramo #${i+1}:`, idError);
                    console.error('Datos del tramo:', JSON.stringify(tramoData));
                    throw new Error(`Error al generar ID: ${idError.message}`);
                }
                
                // Solo buscar superposiciones con tramos del mismo tipo exacto
                const tramosConMismoId = mapaExistentes[tramoId] || [];
                console.log(`[IMPORT] Encontrados ${tramosConMismoId.length} tramos posibles con ID "${tramoId}"`);

                // Verificación EXPLÍCITA por tipo para diagnóstico
                console.log(`[IMPORT] Verificación por tipo del tramo #${i+1}:`);
                const todosLosTramos = Object.values(mapaExistentes).flat();
                // Verificar si tienen el mismo ID (que incluye tipo)
                const tramosConMismoOrigenDestino = todosLosTramos.filter(t => 
                    t.origen.toString() === tramoData.origen.toString() && 
                    t.destino.toString() === tramoData.destino.toString());
                    
                const tramosConDiferenteTipo = tramosConMismoOrigenDestino.filter(t => t.tipo !== tramoData.tipo);
                const tramosConMismoTipo = tramosConMismoOrigenDestino.filter(t => t.tipo === tramoData.tipo);
                
                console.log(`[IMPORT] - Total tramos mismo origen-destino: ${tramosConMismoOrigenDestino.length}`);
                console.log(`[IMPORT] - Con diferente tipo: ${tramosConDiferenteTipo.length}`);
                console.log(`[IMPORT] - Con mismo tipo: ${tramosConMismoTipo.length}`);
                    
                // Si existen tramos con el mismo origen y destino pero distinto tipo, no son duplicados
                if (tramosConDiferenteTipo.length > 0) {
                    console.log(`[IMPORT] ℹ️ Hay tramos con mismo origen-destino pero tipo diferente:`);
                    tramosConDiferenteTipo.forEach(t => {
                        console.log(`[IMPORT] - Tramo ID: ${t._id}, Tipo: ${t.tipo}`);
                    });
                }
                // Si encontramos un tramo existente con fechas superpuestas
                let tramoExistente = null;
                // Validación manual: solo verificar tramos con el MISMO tipo explícitamente
                for (const existente of tramosConMismoTipo) {
                    console.log(`[IMPORT] Verificando superposición con tramo existente ID ${existente._id}:`);
                    console.log(`[IMPORT] - Tipo actual: ${tramoData.tipo}, Tipo existente: ${existente.tipo}`);
                    
                    // Si tienen distinto tipo, NO pueden ser duplicados (verificación redundante)
                    if (existente.tipo !== tramoData.tipo) {
                        console.log(`[IMPORT] Tipos diferentes, omitiendo verificación de fechas`);
                        continue;
                    }   

                    if (fechasSuperpuestas(
                        fechaDesde,
                        fechaHasta,
                        new Date(existente.vigenciaDesde),
                        new Date(existente.vigenciaHasta)
                    )) {
                        tramoExistente = existente;
                        break;
                    }
                }

                if (tramoExistente) {
                    console.error(`[IMPORT] ❌ Tramo duplicado detectado: ${tramoId}`);
                    console.error(`[IMPORT] - Tramo existente: ${JSON.stringify(tramoExistente)}`);
                    
                    resultados.errores.push({
                        tipo: 'superposición',
                        nuevo: {
                            origen: tramoData.origen,
                            destino: tramoData.destino,
                            fechaDesde,
                            fechaHasta,
                            tipo: tramoData.tipo,
                            metodo: tramoData.metodoCalculo
                        },
                        existente: {
                            _id: tramoExistente._id,
                            origen: tramoExistente.origen,
                            destino: tramoExistente.destino,
                            tipo: tramoExistente.tipo,
                            metodo: tramoExistente.metodoCalculo,
                            desde: tramoExistente.vigenciaDesde,
                            hasta: tramoExistente.vigenciaHasta
                        }
                    });

                    // Obtener nombres para mensajes de error
                    const origen = await Site.findById(tramoData.origen).select('Site').lean();
                    const destino = await Site.findById(tramoData.destino).select('Site').lean();
                    
                    const origenExistente = await Site.findById(tramoExistente.origen).select('Site').lean();
                    const destinoExistente = await Site.findById(tramoExistente.destino).select('Site').lean();
                    
                    const mensajeError = `Tramo duplicado: ${origen?.Site || tramoData.origen} → ${destino?.Site || tramoData.destino} ` +
                        `(${tramoData.tipo || 'TRMC'}/${tramoData.metodoCalculo || 'Kilometro'}) ` +
                        `con fechas superpuestas. ` +
                        `Nuevo: ${format(fechaDesde, 'dd/MM/yyyy')} - ${format(fechaHasta, 'dd/MM/yyyy')}, ` +
                        `Existente: ${format(new Date(tramoExistente.vigenciaDesde), 'dd/MM/yyyy')} - ${format(new Date(tramoExistente.vigenciaHasta), 'dd/MM/yyyy')}`;
                    
                    throw {
                        message: mensajeError,
                        tramoExistente: {
                            _id: tramoExistente._id,
                            origen: origenExistente?.Site || tramoExistente.origen,
                            destino: destinoExistente?.Site || tramoExistente.destino,
                            tipo: tramoExistente.tipo,
                            metodo: tramoExistente.metodoCalculo,
                            vigenciaDesde: format(new Date(tramoExistente.vigenciaDesde), 'dd/MM/yyyy'),
                            vigenciaHasta: format(new Date(tramoExistente.vigenciaHasta), 'dd/MM/yyyy'),
                            valor: tramoExistente.valor,
                            valorPeaje: tramoExistente.valorPeaje
                        }
                    };
                }

                console.log(`[IMPORT] ✅ Tramo #${i+1} sin conflictos, procediendo a guardar`);
                const tramoObj = {
                    origen: tramoData.origen,
                    destino: tramoData.destino,
                    tipo: tramoData.tipo,  // Ya normalizado
                    cliente,
                    metodoCalculo: tramoData.metodoCalculo || 'Palet',
                    valor: parseFloat(tramoData.valor) || 0,
                    valorPeaje: parseFloat(tramoData.valorPeaje) || 0,
                    vigenciaDesde: fechaDesde,
                    vigenciaHasta: fechaHasta
                };

                const nuevoTramo = new Tramo(tramoObj);
                await nuevoTramo.save();
                
                // Añadir el tramo recién creado al mapa para evitar duplicados en el mismo lote
                const nuevoId = generarTramoId(nuevoTramo);
                if (!mapaExistentes[nuevoId]) {
                    mapaExistentes[nuevoId] = [];
                }
                mapaExistentes[nuevoId].push({
                    ...nuevoTramo.toObject(),
                    _id: nuevoTramo._id
                });
                console.log(`Añadido al mapa: ${nuevoId} (Tipo: ${nuevoTramo.tipo})`);

                resultados.exitosos++;
            } catch (tramoBatchError) {
                console.error(`Error procesando tramo #${i+1}:`, tramoBatchError);
                console.error('Detalles del error:', tramoBatchError.stack);
                console.error('Datos del tramo con error:', JSON.stringify(tramos[i]));
                
                // Verificar si el error tiene información detallada del tramo existente
                const detalleExistente = tramoBatchError.tramoExistente ? tramoBatchError.tramoExistente : null;
                
                resultados.errores.push({
                    origen: tramos[i].origenNombre || tramos[i].origen || 'desconocido',
                    destino: tramos[i].destinoNombre || tramos[i].destino || 'desconocido',
                    tipo: tramos[i].tipo || 'TRMC',
                    metodo: tramos[i].metodoCalculo || 'Palet',
                    fechaDesde: tramos[i].vigenciaDesde ? 
                        (typeof tramos[i].vigenciaDesde === 'string' ? tramos[i].vigenciaDesde : format(new Date(tramos[i].vigenciaDesde), 'dd/MM/yyyy')) : 'N/A',
                    fechaHasta: tramos[i].vigenciaHasta ? 
                        (typeof tramos[i].vigenciaHasta === 'string' ? tramos[i].vigenciaHasta : format(new Date(tramos[i].vigenciaHasta), 'dd/MM/yyyy')) : 'N/A',
                    error: tramoBatchError.code === 11000 
                        ? 'Tramo duplicado (misma ruta, tipo, fechas y método de cálculo)' 
                        : tramoBatchError.message,
                    tramoExistente: detalleExistente
                });
            }
        }

        console.log('Resultado final importación:', {
            exitosos: resultados.exitosos,
            errores: resultados.errores.length,
            total: resultados.total
        });

        // Mejor información en la respuesta
        res.json({
            success: true,
            mensaje: `Importación completada: ${resultados.exitosos} de ${resultados.total} tramos creados`,
            exitosos: resultados.exitosos,
            errores: resultados.errores,
            total: resultados.total,
            porcentajeExito: resultados.total > 0 ? 
                Math.round((resultados.exitosos / resultados.total) * 100) : 0
        });
    } catch (error) {
        console.error('Error en importación masiva:', error);
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
        console.error('Error al obtener tramos vigentes:', error);
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
        console.error('Error al obtener tramo por ID:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getAllTramos = async (req, res) => {
    try {
        const tramos = await Tramo.find()
            .populate('origen', 'Site')
            .populate('destino', 'Site');
            
        res.json({
            success: true,
            data: tramos
        });
    } catch (error) {
        console.error('Error al obtener todos los tramos:', error);
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
        console.error('Error al crear tramo:', error);
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
        console.error('Error al actualizar tramo:', error);
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
        console.error('Error al eliminar tramo:', error);
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
        console.error('Error al verificar duplicados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar duplicados',
            error: error.message
        });
    }
};

// Método para verificar y normalizar los tipos de tramos
exports.normalizarTiposTramos = async (req, res) => {
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
                
                // Normalizar el tipo
                if (tramo.tipo) {
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
        console.error('Error normalizando tramos:', error);
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
        
        // Crear dos tramos con el mismo origen-destino pero diferentes tipos
        const fechaInicio = new Date();
        const fechaFin = new Date();
        fechaFin.setFullYear(fechaFin.getFullYear() + 1); // Un año de vigencia
        
        const tramoTRMC = new Tramo({
            origen,
            destino,
            tipo: 'TRMC',
            cliente,
            metodoCalculo: 'Kilometro',
            valor: 100,
            vigenciaDesde: fechaInicio,
            vigenciaHasta: fechaFin
        });
        
        const tramoTRMI = new Tramo({
            origen,
            destino,
            tipo: 'TRMI',
            cliente,
            metodoCalculo: 'Kilometro',
            valor: 200,
            vigenciaDesde: fechaInicio,
            vigenciaHasta: fechaFin
        });
        
        // Guardar ambos tramos
        await tramoTRMC.save();
        await tramoTRMI.save();
        
        res.json({
            success: true,
            message: 'Prueba completada correctamente',
            tramos: {
                trmc: tramoTRMC,
                trmi: tramoTRMI
            }
        });
    } catch (error) {
        console.error('Error en prueba de importación:', error);
        res.status(500).json({
            success: false,
            message: 'Error en la prueba de importación',
            error: error.message
        });
    }
};

exports.updateVigenciaMasiva = async (req, res) => {
    try {
        const { tramosIds, vigenciaDesde, vigenciaHasta, cliente } = req.body;

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

            } catch (error) {
                console.error(`Error actualizando tramo ${tramoId}:`, error);
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
        console.error('Error en actualización masiva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar los tramos',
            error: error.message
        });
    }
};

// Export the module
module.exports = exports;
