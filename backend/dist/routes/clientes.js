import express from 'express';
const router = express.Router();
import { getClientes, getClienteById, createCliente, updateCliente, deleteCliente } from '../controllers/clienteController';
import { authenticateToken } from '../middleware/authMiddleware';
// Rutas
router.get('/', authenticateToken, getClientes);
router.get('/:id', authenticateToken, getClienteById);
router.post('/', authenticateToken, createCliente);
router.put('/:id', authenticateToken, updateCliente);
router.delete('/:id', authenticateToken, deleteCliente);
export default router;
//# sourceMappingURL=clientes.js.map