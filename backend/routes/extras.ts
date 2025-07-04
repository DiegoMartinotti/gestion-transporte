import express from 'express';
const router = express.Router();
import Extra from '../models/Extra';
import { authenticateToken } from '../middleware/authMiddleware';
import logger from '../utils/logger';
import { getExtraTemplate } from '../controllers/extraController';

// GET /api/extras - Obtener todos los extras o filtrar por cliente
router.get('/', authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const query = req.query.cliente ? { cliente: (req.query.cliente as string).toUpperCase() } : {};
        const extras = await Extra.find(query);
        res.json(extras);
    } catch (error) {
        logger.error('Error al obtener extras:', error);
        res.status(500).json({ error: 'Error al obtener extras' });
    }
});

// GET /api/extras/template - Descargar plantilla Excel
router.get('/template', getExtraTemplate);

// POST /api/extras - Crear un nuevo extra
router.post('/', authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const extra = new Extra(req.body);
        await extra.save();
        res.status(201).json(extra);
    } catch (error) {
        logger.error('Error al crear extra:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

// PUT /api/extras/:id - Actualizar un extra
router.put('/:id', authenticateToken, async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const extra = await Extra.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!extra) {
            res.status(404).json({ error: 'Extra no encontrado' });
            return;
        }
        res.json(extra);
    } catch (error) {
        logger.error('Error al actualizar extra:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

// DELETE /api/extras/:id - Eliminar un extra
router.delete('/:id', authenticateToken, async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const extra = await Extra.findByIdAndDelete(req.params.id);
        if (!extra) {
            res.status(404).json({ error: 'Extra no encontrado' });
            return;
        }
        res.json({ message: 'Extra eliminado correctamente' });
    } catch (error) {
        logger.error('Error al eliminar extra:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

export default router;