/**
 * @module routes/tramo.routes
 * @description Rutas para el módulo de tramos
 */

import express from 'express';
const router = express.Router();
import * as tramoController from '../controllers/tramo';
import * as tramoControllerTS from '../controllers/tramoController';
import logger from '../utils/logger';

// Middleware para debugging de solicitudes grandes
router.use('/bulk', (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    logger.debug('Recibiendo solicitud bulk import:');
    logger.debug('- Headers:', req.headers);
    logger.debug('- Cliente:', req.body?.cliente);
    logger.debug('- Cantidad tramos:', req.body?.tramos?.length || 0);
    
    if (!req.body || !req.body.tramos) {
        logger.error('⚠️ CUERPO DE LA SOLICITUD VACÍO O INCOMPLETO');
        logger.error('Content-Type:', req.headers['content-type']);
        logger.error('Content-Length:', req.headers['content-length']);
        res.status(400).json({
            success: false,
            message: 'Datos de solicitud vacíos o inválidos',
            debug: {
                contentType: req.headers['content-type'],
                contentLength: req.headers['content-length'],
                bodyEmpty: !req.body,
                tramosEmpty: !req.body?.tramos
            }
        });
        return;
    }
    
    next();
});

// Rutas específicas
router.get('/cliente/:cliente', tramoController.getTramosByCliente);
router.get('/distancias', tramoController.getDistanciasCalculadas);

// Ruta para calcular tarifa
router.post('/:id/calculate-tarifa', tramoControllerTS.calcularTarifa);

// Rutas para tarifas históricas (por implementar)
// router.get('/:id/tarifas', tramoControllerTS.getTarifaVersions);
// router.post('/:id/tarifas', tramoControllerTS.createTarifaVersion);
// router.put('/:id/tarifas/:versionId', tramoControllerTS.updateTarifaVersion);
// router.patch('/:id/tarifas/:versionId/toggle', tramoControllerTS.toggleTarifaVersion);
// router.post('/:id/tarifas/detect-conflicts', tramoControllerTS.detectConflicts);
// router.post('/:id/tarifas/preview', tramoControllerTS.previewCalculation);

// Exportar el router
export default router;