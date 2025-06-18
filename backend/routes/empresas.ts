import express from 'express';
const router = express.Router();
import { 
    getEmpresas, 
    getEmpresaById, 
    createEmpresa, 
    updateEmpresa, 
    deleteEmpresa,
    getEmpresasByTipo,
    getEmpresasActivas
} from '../controllers/empresaController';
import logger from '../utils/logger';

// Rutas básicas CRUD
router.get('/', getEmpresas);
router.get('/activas', getEmpresasActivas);
router.get('/tipo/:tipo', getEmpresasByTipo);
router.get('/:id', getEmpresaById);
router.post('/', createEmpresa);
router.put('/:id', updateEmpresa);
router.delete('/:id', deleteEmpresa);

export default router;