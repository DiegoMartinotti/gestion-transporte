import axios from 'axios';
import logger from '../utils/logger';

// Configuración (podría ir en un archivo .env)
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'MiAppBackend/1.0 (tu_email@example.com)'; // ¡IMPORTANTE: Cambia esto por tu info!

interface AddressResult {
  direccion: string;
  localidad: string;
  provincia: string;
}

interface NominatimAddress {
  road?: string;
  house_number?: string;
  pedestrian?: string;
  footway?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  municipality?: string;
  state?: string;
  state_district?: string;
}

interface NominatimResponse {
  address?: NominatimAddress;
}

/**
 * Construye la dirección a partir de los campos disponibles en la respuesta de Nominatim
 */
const buildDireccion = (address: NominatimAddress): string => {
  if (address.road) {
    return `${address.road} ${address.house_number || ''}`.trim();
  }
  return address.pedestrian || address.footway || '';
};

/**
 * Obtiene la localidad a partir de los campos disponibles
 */
const getLocalidad = (address: NominatimAddress): string => {
  return (
    address.city || address.town || address.village || address.county || address.municipality || ''
  );
};

/**
 * Obtiene la provincia a partir de los campos disponibles
 */
const getProvincia = (address: NominatimAddress): string => {
  return address.state || address.state_district || '';
};

/**
 * Maneja los errores de la llamada a Nominatim
 */
const handleNominatimError = (error: unknown, lat: number, lng: number): void => {
  if (axios.isAxiosError(error)) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      `Error Axios llamando a Nominatim para ${lat},${lng}: ${errorMessage} - Status: ${error.response?.status}`
    );
  } else {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logger.error(`Error inesperado llamando a Nominatim para ${lat},${lng}: ${errorMessage}`);
  }
};

/**
 * Procesa la respuesta de Nominatim y construye el resultado
 */
const processNominatimResponse = (
  response: NominatimResponse,
  lat: number,
  lng: number
): AddressResult | null => {
  if (!response.address) {
    logger.warn(
      `No se encontraron detalles de dirección para ${lat},${lng} en Nominatim. Respuesta: ${JSON.stringify(response)}`
    );
    return null;
  }

  const address = response.address;
  const direccion = buildDireccion(address);
  const localidad = getLocalidad(address);
  const provincia = getProvincia(address);

  logger.debug(
    `Geocodificación inversa exitosa para ${lat},${lng}: ${direccion}, ${localidad}, ${provincia}`
  );

  return {
    direccion: direccion || '-',
    localidad: localidad || '-',
    provincia: provincia || '-',
  };
};

/**
 * Obtiene la dirección (calle, localidad, provincia) a partir de coordenadas usando Nominatim.
 * @param lat - Latitud
 * @param lng - Longitud
 * @returns Objeto con la dirección o null si falla.
 */
const getAddressFromCoords = async (lat: number, lng: number): Promise<AddressResult | null> => {
  try {
    const url = `${NOMINATIM_URL}?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    logger.debug(`Llamando a Nominatim: ${url}`);

    const response = await axios.get<NominatimResponse>(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'es',
      },
      timeout: 10000,
    });

    return processNominatimResponse(response.data, lat, lng);
  } catch (error) {
    handleNominatimError(error, lat, lng);
    return null;
  }
};

export { getAddressFromCoords };
