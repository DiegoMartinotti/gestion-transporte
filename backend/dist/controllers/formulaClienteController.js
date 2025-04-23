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
const FormulasPersonalizadasCliente = require('../models/FormulasPersonalizadasCliente');
const Cliente = require('../models/Cliente');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
// Helper para validar solapamiento
function checkOverlap(clienteId_1, tipoUnidad_1, vigenciaDesde_1, vigenciaHasta_1) {
    return __awaiter(this, arguments, void 0, function* (clienteId, tipoUnidad, vigenciaDesde, vigenciaHasta, excludeId = null) {
        const query = {
            clienteId: clienteId,
            tipoUnidad: tipoUnidad,
            $or: [
                // Nueva fórmula empieza durante una existente
                { vigenciaDesde: { $lt: vigenciaHasta || new Date(8640000000000000) }, vigenciaHasta: { $gt: vigenciaDesde } },
                // Nueva fórmula termina durante una existente
                { vigenciaDesde: { $lt: vigenciaHasta || new Date(8640000000000000) }, vigenciaHasta: null }, // Existente activa
                // Nueva fórmula envuelve completamente una existente
                { vigenciaDesde: { $gte: vigenciaDesde }, vigenciaHasta: { $lte: vigenciaHasta || new Date(8640000000000000) } },
                // Existente envuelve completamente la nueva
                { vigenciaDesde: { $lte: vigenciaDesde }, vigenciaHasta: { $gte: vigenciaHasta || new Date(8640000000000000) } },
                { vigenciaDesde: { $lte: vigenciaDesde }, vigenciaHasta: null } // Existente activa
            ]
        };
        // Si estamos actualizando, excluimos el propio documento de la verificación
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        const overlappingFormula = yield FormulasPersonalizadasCliente.findOne(query);
        return overlappingFormula;
    });
}
exports.createFormula = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { clienteId, tipoUnidad, formula, vigenciaDesde, vigenciaHasta } = req.body;
        if (!clienteId || !tipoUnidad || !formula || !vigenciaDesde) {
            return res.status(400).json({ message: 'Faltan campos requeridos: clienteId, tipoUnidad, formula, vigenciaDesde' });
        }
        // Validar que el cliente exista
        const clienteExists = yield Cliente.findById(clienteId);
        if (!clienteExists) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        // Validar fechas
        const desdeDate = new Date(vigenciaDesde);
        const hastaDate = vigenciaHasta ? new Date(vigenciaHasta) : null;
        if (hastaDate && desdeDate >= hastaDate) {
            return res.status(400).json({ message: 'La fecha de vigenciaDesde debe ser anterior a vigenciaHasta' });
        }
        // Validar solapamiento
        const overlap = yield checkOverlap(clienteId, tipoUnidad, desdeDate, hastaDate);
        if (overlap) {
            return res.status(400).json({
                message: `El período de vigencia se solapa con una fórmula existente (ID: ${overlap._id}, Vigencia: ${overlap.vigenciaDesde.toISOString().split('T')[0]} - ${overlap.vigenciaHasta ? overlap.vigenciaHasta.toISOString().split('T')[0] : 'Activa'})`,
                overlappingFormula: overlap
            });
        }
        const nuevaFormula = new FormulasPersonalizadasCliente({
            clienteId,
            tipoUnidad,
            formula,
            vigenciaDesde: desdeDate,
            vigenciaHasta: hastaDate
        });
        yield nuevaFormula.save();
        logger.info(`Nueva fórmula creada para cliente ${clienteId}, tipo ${tipoUnidad}`);
        res.status(201).json(nuevaFormula);
    }
    catch (error) {
        logger.error('Error al crear fórmula personalizada:', error);
        res.status(500).json({ message: 'Error interno al crear la fórmula', error: error.message });
    }
});
exports.getFormulasByCliente = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { clienteId } = req.params;
        const { tipoUnidad, fecha } = req.query;
        if (!mongoose.Types.ObjectId.isValid(clienteId)) {
            return res.status(400).json({ message: 'ID de cliente inválido' });
        }
        const query = { clienteId: clienteId };
        if (tipoUnidad) {
            query.tipoUnidad = tipoUnidad;
        }
        if (fecha) {
            const fechaDate = new Date(fecha);
            query.vigenciaDesde = { $lte: fechaDate };
            query.$or = [
                { vigenciaHasta: { $gte: fechaDate } },
                { vigenciaHasta: null }
            ];
        }
        const formulas = yield FormulasPersonalizadasCliente.find(query).sort({ tipoUnidad: 1, vigenciaDesde: -1 });
        logger.debug(`Encontradas ${formulas.length} fórmulas para cliente ${clienteId} con filtros:`, req.query);
        res.json(formulas);
    }
    catch (error) {
        logger.error(`Error al obtener fórmulas para cliente ${req.params.clienteId}:`, error);
        res.status(500).json({ message: 'Error interno al obtener fórmulas', error: error.message });
    }
});
exports.updateFormula = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { formula, vigenciaDesde, vigenciaHasta } = req.body; // Solo permitir actualizar estos campos
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de fórmula inválido' });
        }
        const formulaExistente = yield FormulasPersonalizadasCliente.findById(id);
        if (!formulaExistente) {
            return res.status(404).json({ message: 'Fórmula no encontrada' });
        }
        // Validar fechas si se proporcionan
        const desdeDate = vigenciaDesde ? new Date(vigenciaDesde) : formulaExistente.vigenciaDesde;
        const hastaDate = vigenciaHasta ? new Date(vigenciaHasta) : formulaExistente.vigenciaHasta; // Cuidado si se quiere poner null
        if (req.body.hasOwnProperty('vigenciaHasta') && vigenciaHasta === null) {
            // Permitir establecer vigenciaHasta a null
        }
        else if (hastaDate && desdeDate >= hastaDate) {
            return res.status(400).json({ message: 'La fecha de vigenciaDesde debe ser anterior a vigenciaHasta' });
        }
        // Validar solapamiento excluyendo el documento actual
        const overlap = yield checkOverlap(formulaExistente.clienteId, formulaExistente.tipoUnidad, desdeDate, hastaDate, id);
        if (overlap) {
            return res.status(400).json({
                message: `El nuevo período de vigencia se solapa con otra fórmula existente (ID: ${overlap._id})`,
                overlappingFormula: overlap
            });
        }
        // Actualizar campos permitidos
        if (formula)
            formulaExistente.formula = formula;
        if (vigenciaDesde)
            formulaExistente.vigenciaDesde = desdeDate;
        // Manejar explícitamente la actualización de vigenciaHasta (incluyendo null)
        if (req.body.hasOwnProperty('vigenciaHasta')) {
            formulaExistente.vigenciaHasta = hastaDate;
        }
        const formulaActualizada = yield formulaExistente.save();
        logger.info(`Fórmula ${id} actualizada.`);
        res.json(formulaActualizada);
    }
    catch (error) {
        logger.error(`Error al actualizar fórmula ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error interno al actualizar la fórmula', error: error.message });
    }
});
exports.deleteFormula = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de fórmula inválido' });
        }
        const formula = yield FormulasPersonalizadasCliente.findByIdAndDelete(id);
        if (!formula) {
            return res.status(404).json({ message: 'Fórmula no encontrada' });
        }
        logger.info(`Fórmula ${id} eliminada.`);
        res.json({ message: 'Fórmula eliminada exitosamente' });
    }
    catch (error) {
        logger.error(`Error al eliminar fórmula ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error interno al eliminar la fórmula', error: error.message });
    }
});
//# sourceMappingURL=formulaClienteController.js.map