import axios from 'axios';
import logger from '../utils/logger';
// Usando OSRM (Open Source Routing Machine)
const OSRM_URL = 'http://router.project-osrm.org/route/v1/driving';
async function calcularDistanciaRuta(origen, destino) {
    try {
        const url = `${OSRM_URL}/${origen[0]},${origen[1]};${destino[0]},${destino[1]}`;
        logger.debug('Calculando ruta:', url);
        const response = await axios.get(url, {
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
}
export { calcularDistanciaRuta };
//# sourceMappingURL=routingService.js.map