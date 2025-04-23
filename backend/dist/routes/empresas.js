"use strict";
const express = require('express');
const router = express.Router();
const { getEmpresas, getEmpresaById, createEmpresa, updateEmpresa, deleteEmpresa, getEmpresasByTipo, getEmpresasActivas } = require('../controllers/empresaController');
const logger = require('../utils/logger');
// Rutas básicas CRUD
router.get('/', getEmpresas);
router.get('/activas', getEmpresasActivas);
router.get('/tipo/:tipo', getEmpresasByTipo);
router.get('/:id', getEmpresaById);
router.post('/', createEmpresa);
router.put('/:id', updateEmpresa);
router.delete('/:id', deleteEmpresa);
module.exports = router;
//# sourceMappingURL=empresas.js.map