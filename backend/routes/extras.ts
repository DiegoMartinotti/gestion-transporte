import express from 'express';
const router = express.Router();
import { authenticateToken } from '../middleware/authMiddleware';
import * as extraController from '../controllers/extra';

// GET /api/extras - Obtener todos los extras o filtrar por cliente
router.get('/', authenticateToken, extraController.getAllExtras);

// GET /api/extras/template - Descargar plantilla Excel
router.get('/template', extraController.getExtraTemplate);

// GET /api/extras/:id - Obtener extra por ID
router.get('/:id', authenticateToken, extraController.getExtraById);

// POST /api/extras - Crear un nuevo extra
router.post('/', authenticateToken, extraController.createExtra);

// PUT /api/extras/:id - Actualizar un extra
router.put('/:id', authenticateToken, extraController.updateExtra);

// DELETE /api/extras/:id - Eliminar un extra
router.delete('/:id', authenticateToken, extraController.deleteExtra);

export default router;