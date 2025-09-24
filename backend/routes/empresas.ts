import express from 'express';
const router = express.Router();
import {
  getAllEmpresas,
  getEmpresaById,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
  getEmpresasByTipo,
  getEmpresasActivas,
  getEmpresaTemplate,
} from '../controllers/empresa';

// Rutas básicas CRUD
router.get('/', getAllEmpresas);
router.get('/activas', getEmpresasActivas);
router.get('/template', getEmpresaTemplate);
router.get('/tipo/:tipo', getEmpresasByTipo);
router.get('/:id', getEmpresaById);
router.post('/', createEmpresa);
router.put('/:id', updateEmpresa);
router.delete('/:id', deleteEmpresa);

export default router;
