const express = require('express');
const router = express.Router();
const { 
    getViajes, 
    getViajeById, 
    createViaje, 
    updateViaje, 
    deleteViaje 
} = require('../controllers/viajeController');

router.use((req, res, next) => {
    console.log(`Viajes Route: ${req.method} ${req.path}`);
    next();
});

router.get('/', getViajes);
router.get('/:id', getViajeById);
router.post('/', createViaje);
router.put('/:id', updateViaje);
router.delete('/:id', deleteViaje);

module.exports = router;
