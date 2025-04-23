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
const logger = require('../utils/logger');
// Definir la fórmula estándar globalmente (o cargarla desde configuración)
const FORMULA_ESTANDAR = "Valor * Palets + Peaje"; // Confirmar si esta es la correcta
/**
 * Obtiene la fórmula de tarifa aplicable para un cliente en una fecha específica.
 * Busca una fórmula personalizada vigente; si no existe, devuelve la estándar.
 *
 * @param {string} clienteId - ID del cliente.
 * @param {string} tipoUnidad - Tipo de unidad (ej. 'Sider', 'Bitren', 'General').
 * @param {Date} fechaDeCalculo - La fecha para la cual se busca la fórmula.
 * @returns {Promise<string>} La fórmula string aplicable.
 */
function getFormulaAplicable(clienteId, tipoUnidad, fechaDeCalculo) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        try {
            logger.debug(`Buscando fórmula para cliente ${clienteId}, unidad ${tipoUnidad}, fecha ${fechaDeCalculo.toISOString()}`);
            const fecha = new Date(fechaDeCalculo); // Asegurar que es un objeto Date
            // Validación de parámetros
            if (!clienteId) {
                logger.warn('clienteId no proporcionado para buscar fórmula');
                return FORMULA_ESTANDAR;
            }
            if (!tipoUnidad) {
                logger.warn('tipoUnidad no proporcionado, asumiendo Sider');
                tipoUnidad = 'Sider';
            }
            // Buscar todas las fórmulas del cliente para entender qué tenemos disponible
            const todasLasFormulas = yield FormulasPersonalizadasCliente.find({
                clienteId: clienteId
            }).sort({ vigenciaDesde: -1 });
            logger.debug(`Total de fórmulas encontradas para cliente ${clienteId}: ${todasLasFormulas.length}`);
            todasLasFormulas.forEach((formula, index) => {
                logger.debug(`Fórmula ${index + 1}: ${formula.formula}, Tipo: ${formula.tipoUnidad}, Vigencia: ${formula.vigenciaDesde} - ${formula.vigenciaHasta || 'indefinida'}`);
            });
            logger.debug(`Buscando fórmula personalizada exacta para clienteId=${clienteId}, tipoUnidad=${tipoUnidad}, fecha=${fecha.toISOString()}`);
            // 1. Buscar fórmula específica para el tipo de unidad y fecha exacta
            const formulaPersonalizada = yield FormulasPersonalizadasCliente.findOne({
                clienteId: clienteId,
                tipoUnidad: tipoUnidad,
                vigenciaDesde: { $lte: fecha },
                $or: [
                    { vigenciaHasta: { $gte: fecha } },
                    { vigenciaHasta: null } // Considera las fórmulas activas sin fecha de fin
                ]
            })
                .sort({ vigenciaDesde: -1 }); // Prioriza la más reciente si hay solapamiento accidental
            if (formulaPersonalizada) {
                logger.debug(`Fórmula personalizada encontrada: ${formulaPersonalizada.formula} (ID: ${formulaPersonalizada._id})`);
                logger.debug(`Vigencia: ${(_a = formulaPersonalizada.vigenciaDesde) === null || _a === void 0 ? void 0 : _a.toISOString()} - ${((_b = formulaPersonalizada.vigenciaHasta) === null || _b === void 0 ? void 0 : _b.toISOString()) || 'indefinida'}`);
                return formulaPersonalizada.formula;
            }
            // 2. Si no encuentra fórmula específica, buscar una fórmula 'General'
            logger.debug(`No se encontró fórmula específica para ${tipoUnidad} en fecha ${fecha.toISOString()}. Buscando fórmula 'General'.`);
            const formulaGeneral = yield FormulasPersonalizadasCliente.findOne({
                clienteId: clienteId,
                tipoUnidad: 'General', // Busca tipo 'General' como fallback
                vigenciaDesde: { $lte: fecha },
                $or: [
                    { vigenciaHasta: { $gte: fecha } },
                    { vigenciaHasta: null }
                ]
            }).sort({ vigenciaDesde: -1 });
            if (formulaGeneral) {
                logger.debug(`Fórmula personalizada general encontrada: ${formulaGeneral.formula} (ID: ${formulaGeneral._id})`);
                logger.debug(`Vigencia: ${(_c = formulaGeneral.vigenciaDesde) === null || _c === void 0 ? void 0 : _c.toISOString()} - ${((_d = formulaGeneral.vigenciaHasta) === null || _d === void 0 ? void 0 : _d.toISOString()) || 'indefinida'}`);
                return formulaGeneral.formula;
            }
            // 3. Buscar la fórmula más reciente antes de la fecha especificada (histórica)
            logger.debug(`No se encontró fórmula vigente. Buscando fórmula histórica más reciente para ${tipoUnidad}`);
            const formulaHistorica = yield FormulasPersonalizadasCliente.findOne({
                clienteId: clienteId,
                tipoUnidad: tipoUnidad,
                vigenciaDesde: { $lte: fecha }
            }).sort({ vigenciaDesde: -1 });
            if (formulaHistorica) {
                logger.debug(`Fórmula histórica encontrada: ${formulaHistorica.formula} (ID: ${formulaHistorica._id})`);
                logger.debug(`Vigencia: ${(_e = formulaHistorica.vigenciaDesde) === null || _e === void 0 ? void 0 : _e.toISOString()} - ${((_f = formulaHistorica.vigenciaHasta) === null || _f === void 0 ? void 0 : _f.toISOString()) || 'indefinida'}`);
                return formulaHistorica.formula;
            }
            // 4. Buscar cualquier fórmula para el cliente como último recurso
            logger.debug(`No se encontró fórmula histórica. Buscando cualquier fórmula disponible.`);
            const cualquierFormula = yield FormulasPersonalizadasCliente.findOne({
                clienteId: clienteId,
                $or: [
                    { tipoUnidad: tipoUnidad },
                    { tipoUnidad: 'General' }
                ]
            }).sort({ vigenciaDesde: -1 });
            if (cualquierFormula) {
                logger.debug(`Encontrada fórmula alternativa: ${cualquierFormula.formula} (ID: ${cualquierFormula._id})`);
                logger.debug(`Tipo: ${cualquierFormula.tipoUnidad}, Vigencia: ${(_g = cualquierFormula.vigenciaDesde) === null || _g === void 0 ? void 0 : _g.toISOString()} - ${((_h = cualquierFormula.vigenciaHasta) === null || _h === void 0 ? void 0 : _h.toISOString()) || 'indefinida'}`);
                return cualquierFormula.formula;
            }
            // 5. Sin fórmulas disponibles, usar la estándar
            logger.debug('No se encontró ninguna fórmula para el cliente. Usando fórmula estándar global.');
            return FORMULA_ESTANDAR;
        }
        catch (error) {
            logger.error(`Error buscando fórmula aplicable para cliente ${clienteId}:`, error);
            // En caso de error, devolver la estándar como fallback seguro
            return FORMULA_ESTANDAR;
        }
    });
}
module.exports = {
    getFormulaAplicable,
    FORMULA_ESTANDAR // Exportar por si se necesita en otro lado
};
//# sourceMappingURL=formulaClienteService.js.map