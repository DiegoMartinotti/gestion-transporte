const express = require('express');
const router = express.Router();
const { 
    getClientes, 
    getClienteById, 
    createCliente, 
    updateCliente, 
    deleteCliente 
} = require('../controllers/clienteController');

// Logging middleware
router.use((req, res, next) => {
    console.log(`Clientes Route: ${req.method} ${req.path}`);
    next();
});

router.get('/', getClientes);
router.get('/:id', getClienteById);
router.post('/', createCliente);
router.put('/:id', updateCliente);
router.delete('/:id', deleteCliente);

module.exports = router;
