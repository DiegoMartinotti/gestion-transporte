const express = require('express');
const router = express.Router();
const formulaClienteController = require('../controllers/formulaClienteController');
// const authMiddleware = require('../middleware/authMiddleware'); // Descomentar si se usa autenticación

// Aplicar middleware de autenticación si es necesario
// router.use(authMiddleware);

// Crear una nueva fórmula personalizada
router.post('/', formulaClienteController.createFormula);

// Obtener fórmulas por cliente (con filtros opcionales)
router.get('/cliente/:clienteId', formulaClienteController.getFormulasByCliente);

// Actualizar una fórmula existente
router.put('/:id', formulaClienteController.updateFormula);

// Eliminar una fórmula existente
router.delete('/:id', formulaClienteController.deleteFormula);

module.exports = router; 