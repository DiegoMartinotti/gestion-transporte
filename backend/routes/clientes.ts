import express, { RequestHandler } from 'express';
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
router.get(
  '/',
  authenticateToken as unknown as RequestHandler,
  getClientes as unknown as RequestHandler
);
router.get('/template', getClienteTemplate as unknown as RequestHandler);
router.get(
  '/:id',
  authenticateToken as unknown as RequestHandler,
  getClienteById as unknown as RequestHandler
);
router.post(
  '/',
  authenticateToken as unknown as RequestHandler,
  createCliente as unknown as RequestHandler
);
router.put(
  '/:id',
  authenticateToken as unknown as RequestHandler,
  updateCliente as unknown as RequestHandler
);
router.delete(
  '/:id',
  authenticateToken as unknown as RequestHandler,
  deleteCliente as unknown as RequestHandler
);

export default router; // Test comment
