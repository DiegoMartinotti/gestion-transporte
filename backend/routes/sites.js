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

router.use((req, res, next) => {
    console.log(`Sites Route: ${req.method} ${req.path}`);
    next();
});

// Rutas CRUD
router.get('/', getSites);
router.post('/', createSite);
router.put('/:id', updateSite);
router.delete('/:id', deleteSite);
router.post('/bulk', bulkCreateSites);
router.get('/nearby', searchNearby);

module.exports = router;
