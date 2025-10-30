import express, { RequestHandler } from 'express';
const router = express.Router();
import * as formulaClienteController from '../controllers/formulaCliente';

// Crear una nueva fórmula personalizada
router.post('/', formulaClienteController.createFormula as unknown as RequestHandler);

// Obtener fórmulas por cliente (con filtros opcionales)
router.get(
  '/cliente/:clienteId',
  formulaClienteController.getFormulasByCliente as unknown as RequestHandler
);

// Actualizar una fórmula existente
router.put('/:id', formulaClienteController.updateFormula as unknown as RequestHandler);

// Eliminar una fórmula existente
router.delete('/:id', formulaClienteController.deleteFormula as unknown as RequestHandler);

export default router;
