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
// Usando OSRM (Open Source Routing Machine)
const OSRM_URL = 'http://router.project-osrm.org/route/v1/driving';
function calcularDistanciaRuta(origen, destino) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const url = `${OSRM_URL}/${origen[0]},${origen[1]};${destino[0]},${destino[1]}`;
            logger.debug('Calculando ruta:', url);
            const response = yield axios.get(url, {
                params: {
                    overview: 'false',
                    alternatives: 'false'
                }
            });
            if (response.data.routes && response.data.routes.length > 0) {
                // La distancia viene en metros, convertir a kilómetros y redondear a 2 decimales
                const distanciaKm = Math.round((response.data.routes[0].distance / 1000) * 100) / 100;
                return distanciaKm;
            }
            throw new Error('No se pudo calcular la ruta');
        }
        catch (error) {
            logger.error('Error calculando distancia por ruta:', error);
            throw error;
        }
    });
}
module.exports = { calcularDistanciaRuta };
//# sourceMappingURL=routingService.js.map