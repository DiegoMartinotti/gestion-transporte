import express, { RequestHandler } from 'express';
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
router.get('/', getAllEmpresas as unknown as RequestHandler);
router.get('/activas', getEmpresasActivas as unknown as RequestHandler);
router.get('/template', getEmpresaTemplate as unknown as RequestHandler);
router.get('/tipo/:tipo', getEmpresasByTipo as unknown as RequestHandler);
router.get('/:id', getEmpresaById as unknown as RequestHandler);
router.post('/', createEmpresa as unknown as RequestHandler);
router.put('/:id', updateEmpresa as unknown as RequestHandler);
router.delete('/:id', deleteEmpresa as unknown as RequestHandler);

export default router;
