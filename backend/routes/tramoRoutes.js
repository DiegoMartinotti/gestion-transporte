const express = require('express');
const router = express.Router();
const tramoController = require('../controllers/tramoController');
const { verifyToken } = require('../middleware/verifyToken');
const logger = require('../utils/logger');

// CRUD básico
router.get('/', verifyToken, tramoController.getAllTramos);
router.get('/:id', verifyToken, tramoController.getTramoById);
router.post('/', verifyToken, tramoController.createTramo);
router.put('/:id', verifyToken, tramoController.updateTramo);
router.delete('/:id', verifyToken, tramoController.deleteTramo);

// Rutas específicas
router.get('/cliente/:cliente', verifyToken, tramoController.getTramosByCliente);
router.get('/vigentes/:fecha', verifyToken, tramoController.getVigentesByFecha);
router.post('/bulk', verifyToken, tramoController.bulkCreateTramos);
router.post('/verificar-duplicados', verifyToken, tramoController.verificarPosiblesDuplicados);
router.post('/normalizar-tipos', verifyToken, tramoController.normalizarTiposTramos);

// Ruta de prueba para la funcionalidad de tipos
router.post('/test-tipos', verifyToken, tramoController.testImportacionTipos);

// Diagnóstico específico para el problema de tipos
router.post('/diagnose-tipos', verifyToken, async (req, res) => {
    try {
        // Requerir origen, destino, cliente como parámetros
        const { origen, destino, cliente } = req.body;
        
        if (!origen || !destino || !cliente) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren origen, destino y cliente'
            });
        }
        
        const Tramo = require('../models/Tramo');
        const { generarTramoId } = require('../utils/tramoValidator');
        
        // Buscar todos los tramos con ese origen y destino
        const tramos = await Tramo.find({
            origen,
            destino,
            cliente
        }).lean();
        
        // Agrupar por tipo para análisis
        const porTipo = {};
        tramos.forEach(t => {
            if (!porTipo[t.tipo]) {
                porTipo[t.tipo] = [];
            }
            porTipo[t.tipo].push({
                _id: t._id,
                tipo: t.tipo,
                vigenciaDesde: t.vigenciaDesde,
                vigenciaHasta: t.vigenciaHasta,
                metodoCalculo: t.metodoCalculo,
                generatedId: generarTramoId(t)
            });
        });
        
        res.json({
            success: true,
            mensaje: `Análisis completado: ${tramos.length} tramos para el mismo origen-destino`,
            totalTramos: tramos.length,
            tiposEncontrados: Object.keys(porTipo).length,
            detallesPorTipo: porTipo,
            diagnosis: tramos.length > 0 && Object.keys(porTipo).length > 1 ? 
                'OK: El sistema permite tramos con diferentes tipos' :
                'Problema: No hay tramos con diferentes tipos para este origen-destino'
        });
    } catch (error) {
        logger.error('Error en diagnóstico:', error);
        res.status(500).json({
            success: false,
            message: 'Error en diagnóstico',
            error: error.message
        });
    }
});

// Ruta para actualización masiva de vigencias
router.post('/updateVigenciaMasiva', verifyToken, tramoController.updateVigenciaMasiva);

// Ruta para calcular tarifa
router.post('/calcular-tarifa', verifyToken, tramoController.calcularTarifa);

// Ruta para obtener distancias calculadas
router.get('/distancias', verifyToken, tramoController.getDistanciasCalculadas);

module.exports = router;
