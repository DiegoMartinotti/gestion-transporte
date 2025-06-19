import axios from 'axios';
import logger from '../utils/logger';
// Configuración (podría ir en un archivo .env)
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'MiAppBackend/1.0 (tu_email@example.com)'; // ¡IMPORTANTE: Cambia esto por tu info!
/**
 * Obtiene la dirección (calle, localidad, provincia) a partir de coordenadas usando Nominatim.
 * @param lat - Latitud
 * @param lng - Longitud
 * @returns Objeto con la dirección o null si falla.
 */
const getAddressFromCoords = async (lat, lng) => {
    try {
        // Construir URL asegurándose de que los parámetros se codifican correctamente
        const url = `${NOMINATIM_URL}?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        logger.debug(`Llamando a Nominatim: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': USER_AGENT, // Requerido por Nominatim
                'Accept-Language': 'es' // Preferir resultados en español si es posible
            },
            timeout: 10000 // Timeout de 10 segundos
        });
        if (response.data && response.data.address) {
            const address = response.data.address;
            // Mapeo más robusto de campos de dirección (puede variar según la ubicación)
            const direccion = address.road ? `${address.road} ${address.house_number || ''}`.trim() : address.pedestrian || address.footway || '';
            const localidad = address.city || address.town || address.village || address.county || address.municipality || '';
            const provincia = address.state || address.state_district || ''; // state_district a veces se usa
            logger.debug(`Geocodificación inversa exitosa para ${lat},${lng}: ${direccion}, ${localidad}, ${provincia}`);
            return {
                direccion: direccion || '-', // Devolver '-' si está vacío
                localidad: localidad || '-',
                provincia: provincia || '-'
            };
        }
        else {
            logger.warn(`No se encontraron detalles de dirección para ${lat},${lng} en Nominatim. Respuesta: ${JSON.stringify(response.data)}`);
            return null;
        }
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            logger.error(`Error Axios llamando a Nominatim para ${lat},${lng}: ${error.message} - Status: ${error.response?.status}`);
        }
        else {
            logger.error(`Error inesperado llamando a Nominatim para ${lat},${lng}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
        return null;
    }
};
export { getAddressFromCoords };
//# sourceMappingURL=geocodingService.js.map