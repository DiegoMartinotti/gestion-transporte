const express = require('express');
const router = express.Router();
const Tramo = require('../models/Tramo');
const verifyToken = require('../middleware/verifyToken');
const Site = require('../models/Site');
const Cliente = require('../models/Cliente');
const tramoController = require('../controllers/tramoController');

// Middleware para debugging de solicitudes grandes
router.use('/bulk', (req, res, next) => {
    console.log('Recibiendo solicitud bulk import:');
    console.log('- Headers:', req.headers);
    console.log('- Cliente:', req.body?.cliente);
    console.log('- Cantidad tramos:', req.body?.tramos?.length || 0);
    
    if (!req.body || !req.body.tramos) {
        console.error('⚠️ CUERPO DE LA SOLICITUD VACÍO O INCOMPLETO');
        console.error('Content-Type:', req.headers['content-type']);
        console.error('Content-Length:', req.headers['content-length']);
        return res.status(400).json({
            success: false,
            message: 'Datos de solicitud vacíos o inválidos',
            debug: {
                contentType: req.headers['content-type'],
                contentLength: req.headers['content-length'],
                bodyEmpty: !req.body,
                tramosEmpty: !req.body?.tramos
            }
        });
    }
    
    next();
});

// Middleware para verificar el tipo de tramo
router.use(async (req, res, next) => {
    if (['POST', 'PUT'].includes(req.method) && req.body.tipo) {
        // Normalizar el tipo a mayúsculas
        req.body.tipo = req.body.tipo.toUpperCase();
        
        // Verificar que es un tipo válido
        if (!['TRMC', 'TRMI'].includes(req.body.tipo)) {
            return res.status(400).json({
                success: false,
                message: 'El tipo de tramo debe ser TRMC o TRMI'
            });
        }
    }
    next();
});

// IMPORTANTE: Primero las rutas específicas
// Obtener tramos vigentes a una fecha determinada
router.get('/vigentes/:fecha', verifyToken, async (req, res) => {
  try {
    const fecha = new Date(req.params.fecha);
    
    if (isNaN(fecha.getTime())) {
      return res.status(400).json({ error: 'La fecha proporcionada no es válida' });
    }
    
    const tramos = await Tramo.find({
      vigenciaDesde: { $lte: fecha },
      vigenciaHasta: { $gte: fecha }
    }).populate('origen', 'Site location')
      .populate('destino', 'Site location');
      
    res.json(tramos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mejorar la ruta para obtener tramos por cliente
router.get('/cliente/:cliente', verifyToken, async (req, res) => {
  try {
    console.log('Buscando tramos para cliente:', req.params.cliente);
    
    const tramos = await Tramo.find({ cliente: req.params.cliente })
      .populate('origen', 'Site location')
      .populate('destino', 'Site location');
    
    console.log(`Se encontraron ${tramos.length} tramos para el cliente ${req.params.cliente}`);
    
    // Devolver en formato esperado por el frontend
    res.json({
      success: true,
      data: tramos
    });
  } catch (error) {
    console.error('Error al obtener tramos por cliente:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: error.toString()
    });
  }
});

// Obtener un tramo específico
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const tramo = await Tramo.findById(req.params.id)
      .populate('origen')
      .populate('destino');
    if (!tramo) {
      return res.status(404).json({ error: 'Tramo no encontrado' });
    }
    res.json(tramo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Después las rutas genéricas
// Obtener todos los tramos
router.get('/', verifyToken, async (req, res) => {
  try {
    // Usar populate para incluir datos completos de origen y destino
    const tramos = await Tramo.find()
      .populate('origen')
      .populate('destino');
    res.json(tramos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo tramo
router.post('/', verifyToken, async (req, res) => {
  try {
    // Verificar que el cliente existe
    const clienteExiste = await Cliente.findOne({ Cliente: req.body.cliente });
    if (!clienteExiste) {
      return res.status(400).json({ error: 'El cliente especificado no existe' });
    }

    // Verificar que el origen y destino existen
    const origenExiste = await Site.findById(req.body.origen);
    const destinoExiste = await Site.findById(req.body.destino);
    
    if (!origenExiste) {
      return res.status(400).json({ error: 'El site de origen no existe' });
    }
    
    if (!destinoExiste) {
      return res.status(400).json({ error: 'El site de destino no existe' });
    }
    
    const nuevoTramo = new Tramo(req.body);
    const tramoGuardado = await nuevoTramo.save();
    
    // Poblar los campos de origen y destino antes de enviar la respuesta
    await tramoGuardado.populate('origen');
    await tramoGuardado.populate('destino');
    
    res.status(201).json(tramoGuardado);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Ya existe un tramo con esas características' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Mejorada la ruta bulk para manejar errores mejor
router.post('/bulk', verifyToken, async (req, res) => {
    try {
        console.log('Bulk import - Headers:', {
            contentType: req.headers['content-type'],
            contentLength: req.headers['content-length'],
            authorization: req.headers['authorization'] ? 'Presente' : 'Ausente'
        });

        // Validar formato de la solicitud
        if (!req.body) {
            console.error('Cuerpo de la solicitud nulo o indefinido');
            return res.status(400).json({
                success: false,
                message: 'El cuerpo de la solicitud está vacío'
            });
        }

        const { cliente, tramos } = req.body;
        
        console.log('Datos recibidos en bulk import:', {
            clientePresente: !!cliente,
            tramosPresente: !!tramos,
            tipoTramos: typeof tramos,
            tramosLength: tramos?.length || 0
        });

        if (!cliente) {
            return res.status(400).json({
                success: false,
                message: 'Cliente no especificado'
            });
        }

        if (!tramos || !Array.isArray(tramos)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de tramos inválido',
                debug: {
                    tramosType: typeof tramos,
                    isArray: Array.isArray(tramos)
                }
            });
        }

        // Llamar al controlador para procesar los tramos
        await tramoController.bulkCreateTramos(req, res);
    } catch (error) {
        console.error('Error no controlado en bulk import:', error);
        res.status(500).json({
            success: false,
            message: 'Error en la importación masiva de tramos',
            error: error.message
        });
    }
});

// Nueva ruta para diagnóstico de duplicados
router.post('/diagnostico-tipos', verifyToken, async (req, res) => {
    try {
        const { cliente, origen, destino, metodoCalculo } = req.body;
        
        if (!cliente) {
            return res.status(400).json({
                success: false,
                message: 'Cliente es requerido para el diagnóstico'
            });
        }

        // Construir la consulta base
        const baseQuery = { cliente };
        
        // Añadir filtros opcionales
        if (origen) baseQuery.origen = origen;
        if (destino) baseQuery.destino = destino;
        if (metodoCalculo) baseQuery.metodoCalculo = metodoCalculo;

        // Buscar todos los tramos que coincidan con los criterios
        const tramos = await Tramo.find(baseQuery)
            .populate('origen', 'Site')
            .populate('destino', 'Site')
            .lean();

        console.log(`Encontrados ${tramos.length} tramos para diagnóstico con filtros:`, baseQuery);

        // Analizar los tramos por tipo
        const analisis = {
            totalTramos: tramos.length,
            porTipo: {
                TRMC: tramos.filter(t => t.tipo === 'TRMC').length,
                TRMI: tramos.filter(t => t.tipo === 'TRMI').length,
                otros: tramos.filter(t => !['TRMC', 'TRMI'].includes(t.tipo)).length,
                nulos: tramos.filter(t => !t.tipo).length
            },
            tramosSinTipoNormalizado: tramos.filter(t => t.tipo && t.tipo !== 'TRMC' && t.tipo !== 'TRMI').map(t => ({
                _id: t._id,
                origen: t.origen?.Site,
                destino: t.destino?.Site,
                tipo: t.tipo
            })),
            posiblesConflictos: []
        };

        // Encontrar pares de tramos que podrían estar en conflicto
        // (mismo origen-destino pero diferentes tipos)
        const rutasUnicas = {};
        
        tramos.forEach(tramo => {
            const rutaKey = `${tramo.origen._id}-${tramo.destino._id}-${tramo.metodoCalculo}`;
            if (!rutasUnicas[rutaKey]) {
                rutasUnicas[rutaKey] = [];
            }
            rutasUnicas[rutaKey].push(tramo);
        });

        // Identificar rutas con múltiples tipos
        for (const ruta in rutasUnicas) {
            const tramosRuta = rutasUnicas[ruta];
            if (tramosRuta.length > 1) {
                // Verificar si hay diferentes tipos en esta ruta
                const tiposEnRuta = new Set(tramosRuta.map(t => t.tipo));
                if (tiposEnRuta.size > 1) {
                    analisis.posiblesConflictos.push({
                        ruta: ruta,
                        origen: tramosRuta[0].origen?.Site,
                        destino: tramosRuta[0].destino?.Site,
                        tipos: Array.from(tiposEnRuta),
                        tramos: tramosRuta.map(t => ({
                            _id: t._id,
                            tipo: t.tipo,
                            vigenciaDesde: t.vigenciaDesde,
                            vigenciaHasta: t.vigenciaHasta,
                            valor: t.valor
                        }))
                    });
                }
            }
        }

        res.json({
            success: true,
            analisis
        });
    } catch (error) {
        console.error('Error en diagnóstico de tipos:', error);
        res.status(500).json({
            success: false,
            message: 'Error realizando el diagnóstico',
            error: error.message
        });
    }
});

// Nuevo endpoint para corregir tipos de tramos
router.post('/corregir-tipos', verifyToken, async (req, res) => {
    try {
        const { tramoIds, nuevoTipo } = req.body;
        
        if (!tramoIds || !Array.isArray(tramoIds) || tramoIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren IDs de tramos para corregir'
            });
        }
        
        if (!nuevoTipo || !['TRMC', 'TRMI'].includes(nuevoTipo)) {
            return res.status(400).json({
                success: false,
                message: 'El nuevo tipo debe ser TRMC o TRMI'
            });
        }
        
        const resultados = {
            procesados: tramoIds.length,
            actualizados: 0,
            errores: []
        };
        
        for (const id of tramoIds) {
            try {
                const tramo = await Tramo.findById(id);
                if (tramo) {
                    const tipoAnterior = tramo.tipo;
                    tramo.tipo = nuevoTipo;
                    await tramo.save();
                    resultados.actualizados++;
                    console.log(`Tramo ${id} actualizado de ${tipoAnterior} a ${nuevoTipo}`);
                } else {
                    resultados.errores.push({
                        id,
                        error: 'Tramo no encontrado'
                    });
                }
            } catch (error) {
                resultados.errores.push({
                    id,
                    error: error.message
                });
            }
        }
        
        res.json({
            success: true,
            resultados
        });
    } catch (error) {
        console.error('Error corrigiendo tipos:', error);
        res.status(500).json({
            success: false,
            message: 'Error corrigiendo tipos',
            error: error.message
        });
    }
});

// Actualizar tramo
router.put('/:id', verifyToken, async (req, res) => {
  try {
    // Verificar que el cliente existe si se está actualizando
    if (req.body.cliente) {
      const clienteExiste = await Cliente.findOne({ Cliente: req.body.cliente });
      if (!clienteExiste) {
        return res.status(400).json({ error: 'El cliente especificado no existe' });
      }
    }

    // Si se actualiza origen o destino, verificar que existen
    if (req.body.origen) {
      const origenExiste = await Site.findById(req.body.origen);
      if (!origenExiste) {
        return res.status(400).json({ error: 'El site de origen no existe' });
      }
    }
    
    if (req.body.destino) {
      const destinoExiste = await Site.findById(req.body.destino);
      if (!destinoExiste) {
        return res.status(400).json({ error: 'El site de destino no existe' });
      }
    }

    const tramoActualizado = await Tramo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('origen').populate('destino');
    
    if (!tramoActualizado) {
      return res.status(404).json({ error: 'Tramo no encontrado' });
    }
    res.json(tramoActualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar tramo
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const tramoEliminado = await Tramo.findByIdAndDelete(req.params.id);
    if (!tramoEliminado) {
      return res.status(404).json({ error: 'Tramo no encontrado' });
    }
    res.json({ mensaje: 'Tramo eliminado correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta para verificar posibles duplicados
router.post('/verificarDuplicados', verifyToken, tramoController.verificarPosiblesDuplicados);

// Ruta para actualización masiva de vigencias
router.post('/updateVigenciaMasiva', verifyToken, tramoController.updateVigenciaMasiva);

module.exports = router;
