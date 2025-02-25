const express = require('express');
const router = express.Router();
const Tramo = require('../models/Tramo');
const verifyToken = require('../middleware/verifyToken');
const Site = require('../models/Site');
const Cliente = require('../models/Cliente'); // Agregar esta línea

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

// Obtener tramos por cliente
router.get('/cliente/:cliente', verifyToken, async (req, res) => {
  try {
    const tramos = await Tramo.find({ cliente: req.params.cliente })
      .populate('origen', 'Site location')
      .populate('destino', 'Site location');
    res.json(tramos);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      res.status(400).json({ error: error.message }); // Corregido el status400 por status(400)
    }
  }
});

// Añadir una ruta para importar múltiples tramos a la vez
router.post('/bulk', verifyToken, async (req, res) => {
  try {
    const { tramos } = req.body;
    if (!Array.isArray(tramos)) {
      return res.status(400).json({ error: 'Se espera un array de tramos' });
    }

    const results = {
      exitosos: 0,
      errores: []
    };

    for (const tramoData of tramos) {
      try {
        const tramo = new Tramo(tramoData);
        await tramo.save();
        results.exitosos++;
      } catch (error) {
        results.errores.push({
          origen: tramoData.origen,
          destino: tramoData.destino,
          error: error.message
        });
      }
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Error en la importación masiva de tramos' });
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

module.exports = router;
