import express from 'express';
const router = express.Router();
import {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  getClienteTemplate,
} from '../controllers/cliente';
import { authenticateToken } from '../middleware/authMiddleware';

// Rutas
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/', authenticateToken, getClientes as unknown);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/template', getClienteTemplate as unknown);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/:id', authenticateToken, getClienteById as unknown);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/', authenticateToken, createCliente as unknown);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.put('/:id', authenticateToken, updateCliente as unknown);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.delete('/:id', authenticateToken, deleteCliente as unknown);

export default router; // Test comment
