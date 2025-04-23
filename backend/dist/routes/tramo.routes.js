"use strict";
/**
 * @module routes/tramo.routes
 * @description Rutas para el módulo de tramos
 */
const express = require('express');
const router = express.Router();
const tramoController = require('../controllers/tramo');
const logger = require('../utils/logger');
// Middleware para debugging de solicitudes grandes
router.use('/bulk', (req, res, next) => {
    var _a, _b, _c, _d;
    logger.debug('Recibiendo solicitud bulk import:');
    logger.debug('- Headers:', req.headers);
    logger.debug('- Cliente:', (_a = req.body) === null || _a === void 0 ? void 0 : _a.cliente);
    logger.debug('- Cantidad tramos:', ((_c = (_b = req.body) === null || _b === void 0 ? void 0 : _b.tramos) === null || _c === void 0 ? void 0 : _c.length) || 0);
    if (!req.body || !req.body.tramos) {
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
                tramosEmpty: !((_d = req.body) === null || _d === void 0 ? void 0 : _d.tramos)
            }
        });
    }
    next();
});
// Rutas específicas
router.get('/cliente/:cliente', tramoController.getTramosByCliente);
router.get('/distancias', tramoController.getDistanciasCalculadas);
// Exportar el router
module.exports = router;
//# sourceMappingURL=tramo.routes.js.map