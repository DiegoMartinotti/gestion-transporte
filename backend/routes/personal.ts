import express from 'express';
const router = express.Router();
import * as personalController from '../controllers/personalController';

// Rutas para personal
router.get('/', personalController.getAllPersonal);
router.get('/template', personalController.getPersonalTemplate);
router.get('/:id', personalController.getPersonalById);
router.post('/', personalController.createPersonal);
router.put('/:id', personalController.updatePersonal);
router.delete('/:id', personalController.deletePersonal);

// Ruta para importación masiva
router.post('/bulk', personalController.bulkImportPersonal);

export default router;