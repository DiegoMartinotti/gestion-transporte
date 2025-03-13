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

// Rutas
router.get('/', getSites);
router.post('/', createSite);
router.put('/:id', updateSite);
router.delete('/:id', deleteSite);
router.post('/bulk', bulkCreateSites);
router.get('/nearby', searchNearby);

module.exports = router;
