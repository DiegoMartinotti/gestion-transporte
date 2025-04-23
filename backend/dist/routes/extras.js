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
const Extra = require('../models/Extra');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
// GET /api/extras - Obtener todos los extras o filtrar por cliente
router.get('/', auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = req.query.cliente ? { cliente: req.query.cliente.toUpperCase() } : {};
        const extras = yield Extra.find(query);
        res.json(extras);
    }
    catch (error) {
        logger.error('Error al obtener extras:', error);
        res.status(500).json({ error: 'Error al obtener extras' });
    }
}));
// POST /api/extras - Crear un nuevo extra
router.post('/', auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const extra = new Extra(req.body);
        yield extra.save();
        res.status(201).json(extra);
    }
    catch (error) {
        logger.error('Error al crear extra:', error);
        res.status(500).json({ error: error.message });
    }
}));
// PUT /api/extras/:id - Actualizar un extra
router.put('/:id', auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const extra = yield Extra.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!extra) {
            return res.status(404).json({ error: 'Extra no encontrado' });
        }
        res.json(extra);
    }
    catch (error) {
        logger.error('Error al actualizar extra:', error);
        res.status(500).json({ error: error.message });
    }
}));
// DELETE /api/extras/:id - Eliminar un extra
router.delete('/:id', auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const extra = yield Extra.findByIdAndDelete(req.params.id);
        if (!extra) {
            return res.status(404).json({ error: 'Extra no encontrado' });
        }
        res.json({ message: 'Extra eliminado correctamente' });
    }
    catch (error) {
        logger.error('Error al eliminar extra:', error);
        res.status(500).json({ error: error.message });
    }
}));
module.exports = router;
//# sourceMappingURL=extras.js.map