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
const Site = require('../../models/Site');
const logger = require('../../utils/logger');
const { tryCatch } = require('../../utils/errorHandler');
const { NotFoundError } = require('../../utils/errors');
/**
 * Delete a site
 * @route DELETE /api/site/:id
 * @param {string} id - Site ID
 * @returns {object} Success message
 */
const deleteSite = tryCatch((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const site = yield Site.findByIdAndDelete(id);
    if (!site) {
        throw new NotFoundError('Site no encontrado');
    }
    logger.info(`Site eliminado: ${site.Site}`);
    res.json({
        success: true,
        message: 'Site eliminado exitosamente'
    });
}));
module.exports = deleteSite;
//# sourceMappingURL=deleteSite.js.map