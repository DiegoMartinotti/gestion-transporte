import express from 'express';
const router = express.Router();
import { 
    getClientes, 
    getClienteById, 
    createCliente, 
    updateCliente, 
    deleteCliente,
    getClienteTemplate
} from '../controllers/cliente';
import { authenticateToken } from '../middleware/authMiddleware';

// Rutas
router.get('/', authenticateToken, getClientes as any);
router.get('/template', getClienteTemplate as any);
router.get('/:id', authenticateToken, getClienteById as any);
router.post('/', authenticateToken, createCliente as any);
router.put('/:id', authenticateToken, updateCliente as any);
router.delete('/:id', authenticateToken, deleteCliente as any);

export default router;// Test comment
