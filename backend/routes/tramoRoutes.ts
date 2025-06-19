import { Router, Request, Response } from 'express';
import * as tramoController from '../controllers/tramoController';
import logger from '../utils/logger';
import Tramo from '../models/Tramo';
import { generarTramoId } from '../utils/tramoValidator';

const router = Router();

// CRUD básico
router.get('/', tramoController.getAllTramos);
router.get('/:id', tramoController.getTramoById);
router.post('/', tramoController.createTramo);
router.put('/:id', tramoController.updateTramo);
router.delete('/:id', tramoController.deleteTramo);

// Rutas específicas
router.get('/cliente/:cliente', tramoController.getTramosByCliente);
router.get('/vigentes/:fecha', tramoController.getVigentesByFecha);
router.post('/bulk', tramoController.bulkCreateTramos);
router.post('/verificar-duplicados', tramoController.verificarPosiblesDuplicados);
router.post('/normalizar-tipos', tramoController.normalizarTramos);

// Ruta de prueba para la funcionalidad de tipos
router.post('/test-tipos', tramoController.testImportacionTipos);

// Diagnóstico específico para el problema de tipos
router.post('/diagnose-tipos', async (req: Request, res: Response) => {
    try {
        // Requerir origen, destino, cliente como parámetros
        const { origen, destino, cliente } = req.body;
        
        if (!origen || !destino || !cliente) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren origen, destino y cliente'
            });
        }
        
        // Buscar todos los tramos con ese origen y destino
        const tramos = await Tramo.find({
            origen,
            destino,
            cliente
        }).lean();
        
        // Agrupar por tipo para análisis
        const porTipo: { [key: string]: any[] } = {};
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
    } catch (error: any) {
        logger.error('Error en diagnóstico:', error);
        res.status(500).json({
            success: false,
            message: 'Error en diagnóstico',
            error: error.message
        });
    }
});

// Ruta para actualización masiva de vigencias
router.post('/updateVigenciaMasiva', tramoController.updateVigenciaMasiva);

// Ruta para calcular tarifa
router.post('/calcular-tarifa', tramoController.calcularTarifa);

// Ruta para obtener distancias calculadas
router.get('/distancias', tramoController.getDistanciasCalculadas);

export default router;