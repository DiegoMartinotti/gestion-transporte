"use strict";
const express = require('express');
const router = express.Router();
const viajeController = require('../controllers/viajeController'); // Importar todo el controlador
const logger = require('../utils/logger');
// Eliminar la siguiente línea:
// const { upload } = require('../middleware/fileUpload'); // Importar middleware de subida
// Añadir configuración de multer
const multer = require('multer');
const storage = multer.memoryStorage(); // Usar almacenamiento en memoria
const upload = multer({ storage: storage });
// --- Rutas CRUD estándar ---
router.get('/', viajeController.getViajes);
router.get('/:id', viajeController.getViajeById);
router.post('/', viajeController.createViaje);
router.put('/:id', viajeController.updateViaje);
router.delete('/:id', viajeController.deleteViaje);
// --- Rutas para Importación Masiva Mejorada ---
// Etapa 1: Iniciar la importación y obtener estado inicial/fallos
router.post('/bulk/iniciar', 
// --- Insertar la lógica de validación AQUÍ, en línea ---
(req, res, next) => {
    var _a, _b, _c, _d, _e, _f;
    logger.debug('Middleware inline para /bulk/iniciar:');
    logger.debug('- Cliente:', (_a = req.body) === null || _a === void 0 ? void 0 : _a.cliente);
    logger.debug('- Cantidad viajes:', ((_c = (_b = req.body) === null || _b === void 0 ? void 0 : _b.viajes) === null || _c === void 0 ? void 0 : _c.length) || 0);
    if (!req.body || !Array.isArray(req.body.viajes) || req.body.viajes.length === 0) {
        logger.error('⚠️ CUERPO DE LA SOLICITUD /bulk/iniciar VACÍO O INCOMPLETO (inline)');
        logger.error('Content-Type:', req.headers['content-type']);
        return res.status(400).json({
            success: false,
            message: 'Datos de solicitud vacíos, inválidos o sin array \'viajes\' para iniciar importación',
            debug: {
                contentType: req.headers['content-type'],
                bodyEmpty: !req.body,
                viajesIsArray: Array.isArray((_d = req.body) === null || _d === void 0 ? void 0 : _d.viajes),
                viajesLength: (_f = (_e = req.body) === null || _e === void 0 ? void 0 : _e.viajes) === null || _f === void 0 ? void 0 : _f.length
            }
        });
    }
    next(); // Si la validación pasa, continuar al controlador
}, 
// --- Fin de la lógica inline ---
viajeController.iniciarBulkImportViajes // Controlador principal
);
// Descargar plantillas pre-rellenadas para corrección
router.get('/bulk/template/:importId/:templateType', viajeController.descargarPlantillaCorreccion);
// Procesar una plantilla de corrección subida (Site, Personal, Vehiculo, Tramo)
router.post('/bulk/process-template/:importId/:templateType', upload.single('templateFile'), // Middleware para manejar el archivo subido
viajeController.procesarPlantillaCorreccion // Controlador (Asegúrate que esté implementado)
);
// Etapa 2: Reintentar la importación de viajes fallidos después de procesar correcciones
router.post('/bulk/retry/:importId', viajeController.reintentarImportacionViajes // Controlador (Asegúrate que esté implementado)
);
// Descargar archivo Excel/CSV con los viajes que fallaron definitivamente
router.get('/bulk/fallback/:importId', viajeController.descargarFallbackViajes // Controlador (Asegúrate que esté implementado)
);
module.exports = router;
//# sourceMappingURL=viajes.js.map