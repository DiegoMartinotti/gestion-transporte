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
const axios = require('axios');
const logger = require('../utils/logger');
exports.geocode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { lat, lng } = req.query;
        logger.debug('Geocoding request for:', { lat, lng });
        if (!lat || !lng) {
            return res.status(400).json({
                message: 'Lat y lng son requeridos',
                received: { lat, lng }
            });
        }
        // Validar que lat y lng sean números y estén en rango
        const numLat = parseFloat(lat);
        const numLng = parseFloat(lng);
        if (isNaN(numLat) || isNaN(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
            logger.warn('Coordenadas inválidas recibidas:', { lat, lng });
            return res.status(400).json({
                message: 'Latitud y longitud deben ser números válidos en sus rangos respectivos (-90 a 90 para lat, -180 a 180 para lng)',
                received: { lat, lng }
            });
        }
        const url = 'https://nominatim.openstreetmap.org/reverse';
        logger.debug('Requesting:', url);
        const response = yield axios.get(url, {
            params: {
                lat: numLat,
                lon: numLng,
                format: 'json',
                'accept-language': 'es'
            },
            headers: {
                'User-Agent': 'SitesManagerApp/1.0'
            },
            timeout: 5000 // 5 segundos timeout
        });
        logger.debug('Nominatim response:', response.data);
        res.json(response.data);
    }
    catch (error) {
        logger.error('Geocoding error details:', {
            message: error.message,
            code: error.code,
            response: (_a = error.response) === null || _a === void 0 ? void 0 : _a.data,
            config: {
                url: (_b = error.config) === null || _b === void 0 ? void 0 : _b.url,
                params: (_c = error.config) === null || _c === void 0 ? void 0 : _c.params
            }
        });
        res.status(500).json({
            message: 'Error en geocodificación',
            error: error.message,
            details: (_d = error.response) === null || _d === void 0 ? void 0 : _d.data
        });
    }
});
//# sourceMappingURL=proxyController.js.map