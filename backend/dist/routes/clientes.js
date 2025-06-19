import express from 'express';
const router = express.Router();
import { getClientes, getClienteById, createCliente, updateCliente, deleteCliente } from '../controllers/clienteController';
// Rutas
router.get('/', getClientes);
router.get('/:id', getClienteById);
router.post('/', createCliente);
router.put('/:id', updateCliente);
router.delete('/:id', deleteCliente);
export default router;
//# sourceMappingURL=clientes.js.map