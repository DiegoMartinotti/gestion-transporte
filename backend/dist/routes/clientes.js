"use strict";
const express = require('express');
const router = express.Router();
const { getClientes, getClienteById, createCliente, updateCliente, deleteCliente } = require('../controllers/clienteController');
const logger = require('../utils/logger');
// Rutas
router.get('/', getClientes);
router.get('/:id', getClienteById);
router.post('/', createCliente);
router.put('/:id', updateCliente);
router.delete('/:id', deleteCliente);
module.exports = router;
//# sourceMappingURL=clientes.js.map