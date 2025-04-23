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
 * Update a site
 * @route PUT /api/site/:id
 * @param {string} id - Site ID
 * @param {object} req.body - Site data to update
 * @returns {object} Updated site
 */
const updateSite = tryCatch((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const site = yield Site.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!site) {
        throw new NotFoundError('Site no encontrado');
    }
    logger.info(`Site actualizado: ${site.Site}`);
    res.json({
        success: true,
        data: site
    });
}));
module.exports = updateSite;
//# sourceMappingURL=updateSite.js.map