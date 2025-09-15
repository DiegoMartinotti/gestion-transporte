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
router.get('/', authenticateToken, getClientes as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/template', getClienteTemplate as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/:id', authenticateToken, getClienteById as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/', authenticateToken, createCliente as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.put('/:id', authenticateToken, updateCliente as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.delete('/:id', authenticateToken, deleteCliente as any);

export default router; // Test comment
