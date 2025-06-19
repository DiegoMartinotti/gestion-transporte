import express from 'express';
const router = express.Router();
import Extra from '../models/Extra';
import { authenticateToken } from '../middleware/authMiddleware';
import logger from '../utils/logger';
// GET /api/extras - Obtener todos los extras o filtrar por cliente
router.get('/', authenticateToken, async (req, res) => {
    try {
        const query = req.query.cliente ? { cliente: req.query.cliente.toUpperCase() } : {};
        const extras = await Extra.find(query);
        res.json(extras);
    }
    catch (error) {
        logger.error('Error al obtener extras:', error);
        res.status(500).json({ error: 'Error al obtener extras' });
    }
});
// POST /api/extras - Crear un nuevo extra
router.post('/', authenticateToken, async (req, res) => {
    try {
        const extra = new Extra(req.body);
        await extra.save();
        res.status(201).json(extra);
    }
    catch (error) {
        logger.error('Error al crear extra:', error);
        res.status(500).json({ error: error.message });
    }
});
// PUT /api/extras/:id - Actualizar un extra
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const extra = await Extra.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!extra) {
            res.status(404).json({ error: 'Extra no encontrado' });
            return;
        }
        res.json(extra);
    }
    catch (error) {
        logger.error('Error al actualizar extra:', error);
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/extras/:id - Eliminar un extra
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const extra = await Extra.findByIdAndDelete(req.params.id);
        if (!extra) {
            res.status(404).json({ error: 'Extra no encontrado' });
            return;
        }
        res.json({ message: 'Extra eliminado correctamente' });
    }
    catch (error) {
        logger.error('Error al eliminar extra:', error);
        res.status(500).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=extras.js.map