import express from 'express';
const router = express.Router();
import * as viajeController from '../controllers/viaje'; // Importar controlador modular
import logger from '../utils/logger';

// Añadir configuración de multer
import multer from 'multer';
const storage = multer.memoryStorage(); // Usar almacenamiento en memoria
const upload = multer({ storage: storage });

// --- Rutas CRUD estándar ---
router.get('/', viajeController.getAllViajes);
router.get('/template', viajeController.getViajeTemplate);
router.get('/:id', viajeController.getViajeById);
router.post('/', viajeController.createViaje);
router.put('/:id', viajeController.updateViaje);
router.delete('/:id', viajeController.deleteViaje);

// --- Rutas para Importación Masiva Mejorada ---

// Etapa 1: Iniciar la importación y obtener estado inicial/fallos
router.post('/bulk/iniciar', 
    // --- Insertar la lógica de validación AQUÍ, en línea ---
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
        logger.debug('Middleware inline para /bulk/iniciar:');
        logger.debug('- Cliente:', req.body?.cliente);
        logger.debug('- Cantidad viajes:', req.body?.viajes?.length || 0);
        
        if (!req.body || !Array.isArray(req.body.viajes) || req.body.viajes.length === 0) {
            logger.error('⚠️ CUERPO DE LA SOLICITUD /bulk/iniciar VACÍO O INCOMPLETO (inline)');
            logger.error('Content-Type:', req.headers['content-type']);
            res.status(400).json({
                success: false,
                message: 'Datos de solicitud vacíos, inválidos o sin array \'viajes\' para iniciar importación',
                debug: {
                    contentType: req.headers['content-type'],
                    bodyEmpty: !req.body,
                    viajesIsArray: Array.isArray(req.body?.viajes),
                    viajesLength: req.body?.viajes?.length
                }
            });
            return;
        }
        next(); // Si la validación pasa, continuar al controlador
    },
    // --- Fin de la lógica inline ---
    viajeController.iniciarBulkImportViajes // Controlador principal
);

// Descargar plantillas pre-rellenadas para corrección
router.get(
    '/bulk/template/:importId',
    viajeController.descargarPlantillaCorreccion
);

// Procesar plantilla de corrección completada
router.post(
    '/bulk/process-correction/:importId',
    upload.single('correctionFile'),
    viajeController.procesarPlantillaCorreccion
);

export default router;