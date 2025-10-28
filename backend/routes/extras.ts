import express, { RequestHandler } from 'express';
const router = express.Router();
import { authenticateToken } from '../middleware/authMiddleware';
import * as extraController from '../controllers/extra';

// GET /api/extras - Obtener todos los extras o filtrar por cliente
router.get(
  '/',
  authenticateToken as unknown as RequestHandler,
  extraController.getAllExtras as unknown as RequestHandler
);

// GET /api/extras/template - Descargar plantilla Excel
router.get('/template', extraController.getExtraTemplate as unknown as RequestHandler);

// GET /api/extras/:id - Obtener extra por ID
router.get(
  '/:id',
  authenticateToken as unknown as RequestHandler,
  extraController.getExtraById as unknown as RequestHandler
);

// POST /api/extras - Crear un nuevo extra
router.post(
  '/',
  authenticateToken as unknown as RequestHandler,
  extraController.createExtra as unknown as RequestHandler
);

// PUT /api/extras/:id - Actualizar un extra
router.put(
  '/:id',
  authenticateToken as unknown as RequestHandler,
  extraController.updateExtra as unknown as RequestHandler
);

// DELETE /api/extras/:id - Eliminar un extra
router.delete(
  '/:id',
  authenticateToken as unknown as RequestHandler,
  extraController.deleteExtra as unknown as RequestHandler
);

export default router;
