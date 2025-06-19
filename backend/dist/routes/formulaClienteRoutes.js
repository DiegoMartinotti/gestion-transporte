import express from 'express';
const router = express.Router();
import * as formulaClienteController from '../controllers/formulaClienteController';
// import authMiddleware from '../middleware/authMiddleware'; // Descomentar si se usa autenticación
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
export default router;
//# sourceMappingURL=formulaClienteRoutes.js.map