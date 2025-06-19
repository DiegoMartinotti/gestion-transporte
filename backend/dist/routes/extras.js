import express from 'express';
const router = express.Router();
import Extra from '../models/Extra';
import auth from '../middleware/auth';
import logger from '../utils/logger';
// GET /api/extras - Obtener todos los extras o filtrar por cliente
router.get('/', auth, async (req, res) => {
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
router.post('/', auth, async (req, res) => {
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
router.put('/:id', auth, async (req, res) => {
    try {
        const extra = await Extra.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!extra) {
            return res.status(404).json({ error: 'Extra no encontrado' });
        }
        res.json(extra);
    }
    catch (error) {
        logger.error('Error al actualizar extra:', error);
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/extras/:id - Eliminar un extra
router.delete('/:id', auth, async (req, res) => {
    try {
        const extra = await Extra.findByIdAndDelete(req.params.id);
        if (!extra) {
            return res.status(404).json({ error: 'Extra no encontrado' });
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