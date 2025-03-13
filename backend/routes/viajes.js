const express = require('express');
const router = express.Router();
const { 
    getViajes, 
    getViajeById, 
    createViaje, 
    updateViaje, 
    deleteViaje, 
    bulkCreateViajes 
} = require('../controllers/viajeController');
const verifyToken = require('../middleware/verifyToken');
const logger = require('../utils/logger');

// Middleware para debugging de solicitudes grandes
router.use('/bulk', (req, res, next) => {
    logger.debug('Recibiendo solicitud bulk import de viajes:');
    logger.debug('- Headers:', req.headers);
    logger.debug('- Cliente:', req.body?.cliente);
    logger.debug('- Cantidad viajes:', req.body?.viajes?.length || 0);
    
    if (!req.body || !req.body.viajes) {
        logger.error('⚠️ CUERPO DE LA SOLICITUD VACÍO O INCOMPLETO');
        logger.error('Content-Type:', req.headers['content-type']);
        logger.error('Content-Length:', req.headers['content-length']);
        return res.status(400).json({
            success: false,
            message: 'Datos de solicitud vacíos o inválidos',
            debug: {
                contentType: req.headers['content-type'],
                contentLength: req.headers['content-length'],
                bodyEmpty: !req.body,
                viajesEmpty: !req.body?.viajes
            }
        });
    }
    
    next();
});

// Rutas
router.get('/', verifyToken, getViajes);
router.get('/:id', verifyToken, getViajeById);
router.post('/', verifyToken, createViaje);
router.post('/bulk', verifyToken, bulkCreateViajes);
router.put('/:id', verifyToken, updateViaje);
router.delete('/:id', verifyToken, deleteViaje);

module.exports = router;
