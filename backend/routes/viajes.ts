import express, { RequestHandler } from 'express';
const router = express.Router();
import * as viajeController from '../controllers/viaje'; // Importar controlador modular
import logger from '../utils/logger';

// Añadir configuración de multer con límites de seguridad
import multer from 'multer';
const storage = multer.memoryStorage(); // Usar almacenamiento en memoria
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Límite de 10MB por archivo
    files: 1, // Máximo 1 archivo
    fields: 20, // Máximo 20 campos no-archivo
  },
});

// --- Rutas CRUD estándar ---
router.get('/', viajeController.getAllViajes as unknown as RequestHandler);
router.get('/template', viajeController.getViajeTemplate as unknown as RequestHandler);
router.get('/:id', viajeController.getViajeById as unknown as RequestHandler);
router.post('/', viajeController.createViaje as unknown as RequestHandler);
router.put('/:id', viajeController.updateViaje as unknown as RequestHandler);
router.delete('/:id', viajeController.deleteViaje as unknown as RequestHandler);

// --- Rutas para Importación Masiva Mejorada ---

// Etapa 1: Iniciar la importación y obtener estado inicial/fallos
router.post(
  '/bulk/iniciar',
  // --- Insertar la lógica de validación AQUÍ, en línea ---
  (req, res, next) => {
    logger.debug('Middleware inline para /bulk/iniciar:');
    logger.debug('- Cliente:', req.body?.cliente);
    logger.debug('- Cantidad viajes:', req.body?.viajes?.length || 0);

    if (!req.body || !Array.isArray(req.body.viajes) || req.body.viajes.length === 0) {
      logger.error('⚠️ CUERPO DE LA SOLICITUD /bulk/iniciar VACÍO O INCOMPLETO (inline)');
      logger.error('Content-Type:', req.headers['content-type']);
      res.status(400).json({
        success: false,
        message:
          "Datos de solicitud vacíos, inválidos o sin array 'viajes' para iniciar importación",
        debug: {
          contentType: req.headers['content-type'],
          bodyEmpty: !req.body,
          viajesIsArray: Array.isArray(req.body?.viajes),
          viajesLength: req.body?.viajes?.length,
        },
      });
      return;
    }
    next(); // Si la validación pasa, continuar al controlador
  },
  // --- Fin de la lógica inline ---
  viajeController.iniciarBulkImportViajes as unknown as RequestHandler // Controlador principal
);

// Descargar plantillas pre-rellenadas para corrección
router.get(
  '/bulk/template/:importId',
  viajeController.descargarPlantillaCorreccion as unknown as RequestHandler
);

// Procesar plantilla de corrección completada
router.post(
  '/bulk/process-correction/:importId',
  upload.single('correctionFile'),
  viajeController.procesarPlantillaCorreccion as unknown as RequestHandler
);

export default router;
