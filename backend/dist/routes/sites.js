"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const express = require('express');
const router = express.Router();
const { getSites, createSite, updateSite, deleteSite, bulkCreateSites, searchNearby } = require('../controllers/siteController');
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
router.get('/cliente/:clienteId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { clienteId } = req.params;
        const sites = yield Site.find({ cliente: clienteId })
            .populate('cliente', 'nombre')
            .sort({ nombre: 1 });
        return res.json(sites);
    }
    catch (error) {
        logger.error('Error al obtener sites por cliente:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener sites por cliente',
            error: error.message
        });
    }
}));
module.exports = router;
//# sourceMappingURL=sites.js.map