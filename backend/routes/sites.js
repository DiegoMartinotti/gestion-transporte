const express = require('express');
const router = express.Router();
const { 
    getSites, 
    createSite, 
    updateSite, 
    deleteSite,
    bulkCreateSites,
    searchNearby
} = require('../controllers/siteController');
const logger = require('../utils/logger');
const Site = require('../models/Site');

// Rutas
router.get('/', getSites);
router.post('/', createSite);
router.put('/:id', updateSite);
router.delete('/:id', deleteSite);
router.post('/bulk', bulkCreateSites);
router.get('/nearby', searchNearby);

// Ruta para obtener sites por cliente
router.get('/cliente/:clienteId', async (req, res) => {
    try {
        const { clienteId } = req.params;
        const sites = await Site.find({ cliente: clienteId })
            .populate('cliente', 'nombre')
            .sort({ nombre: 1 });
        
        return res.json(sites);
    } catch (error) {
        logger.error('Error al obtener sites por cliente:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error al obtener sites por cliente',
            error: error.message 
        });
    }
});

module.exports = router;
