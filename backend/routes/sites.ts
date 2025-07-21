import express from 'express';
const router = express.Router();
import { 
    getAllSites,
    createSite, 
    updateSite, 
    deleteSite,
    bulkCreateSites,
    searchNearby,
    getSitesByCliente,
    getSiteTemplate,
    exportSites
} from '../controllers/site';
import logger from '../utils/logger';

// Rutas
router.get('/', getAllSites);
router.get('/template', getSiteTemplate);
router.get('/export', exportSites);
router.post('/', createSite);
router.put('/:id', updateSite);
router.delete('/:id', deleteSite);
router.post('/bulk', bulkCreateSites);
router.get('/nearby', searchNearby);

// Ruta para obtener sites por cliente
router.get('/cliente/:clienteId', getSitesByCliente);

export default router;