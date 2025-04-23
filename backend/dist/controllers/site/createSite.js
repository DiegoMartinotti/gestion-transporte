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
/**
 * Create a new site
 * @route POST /api/site
 * @param {object} req.body - Site data
 * @returns {object} Created site
 */
const createSite = tryCatch((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const nuevoSite = new Site({
        Site: req.body.site,
        Cliente: req.body.cliente,
        Direccion: req.body.direccion || '-',
        Localidad: req.body.localidad || '',
        Provincia: req.body.provincia || '',
        location: req.body.location || null
    });
    yield nuevoSite.save();
    logger.info(`Nuevo site creado: ${nuevoSite.Site} para cliente ${nuevoSite.Cliente}`);
    res.status(201).json({
        success: true,
        data: nuevoSite
    });
}));
module.exports = createSite;
//# sourceMappingURL=createSite.js.map