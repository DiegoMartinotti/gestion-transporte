const express = require('express');
const router = express.Router();
const personalController = require('../controllers/personalController');

// Rutas para personal
router.get('/', personalController.getAllPersonal);
router.get('/:id', personalController.getPersonalById);
router.post('/', personalController.createPersonal);
router.put('/:id', personalController.updatePersonal);
router.delete('/:id', personalController.deletePersonal);

// Ruta para importación masiva
router.post('/bulk', personalController.bulkImportPersonal);

module.exports = router; 