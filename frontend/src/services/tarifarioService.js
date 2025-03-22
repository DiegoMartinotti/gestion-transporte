/**
 * Servicio para la gestión del tarifario
 */
import api from './api';
import logger from '../utils/logger';
import errorService from './errorService';

const BASE_URL = '/api';

/**
 * Obtiene tramos por cliente con filtros opcionales
 * @param {string} clienteId - ID del cliente
 * @param {Object} filtros - Filtros para la consulta
 * @param {string} filtros.desde - Fecha desde (formato YYYY-MM-DD)
 * @param {string} filtros.hasta - Fecha hasta (formato YYYY-MM-DD)
 * @returns {Promise<Object>} Respuesta con tramos
 */
const getTramosByCliente = async (clienteId, filtros = {}) => {
  if (!clienteId) {
    throw new Error('ID de cliente requerido');
  }
  
  let url = `${BASE_URL}/tramo/cliente/${clienteId}`;
  
  // Agregar filtros si existen
  if (filtros.desde && filtros.hasta) {
    url += `?desde=${filtros.desde}&hasta=${filtros.hasta}&incluirHistoricos=true`;
  }
  
  logger.debug(`Solicitando tramos: ${url}`);
  
  try {
    const response = await api.get(url);
    
    // Verificar si la respuesta es válida
    if (!response) {
      logger.error('Respuesta vacía al obtener tramos');
      throw new Error('No se recibió respuesta del servidor');
    }
    
    // Manejar diferentes formatos de respuesta
    if (Array.isArray(response)) {
      // Respuesta es directamente un array
      logger.debug(`Tramos recibidos: ${response.length}`);
      return {
        success: true,
        data: response
      };
    } else if (Array.isArray(response.data)) {
      // data es directamente un array
      logger.debug(`Tramos recibidos: ${response.data.length}`);
      return {
        success: true,
        data: response.data
      };
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      // formato anidado: response.data.data es un array
      logger.debug(`Tramos recibidos: ${response.data.data.length}`);
      return {
        success: true,
        data: response.data.data
      };
    } else if (response.success === true) {
      // Nuevo formato estándar del backend
      logger.debug(`Tramos recibidos: ${response.data?.length || 0}`);
      return response;
    }
    
    logger.error('Formato de respuesta no reconocido para tramos', response);
    throw new Error('Formato de respuesta no reconocido');
    
  } catch (error) {
    // Usar el servicio de errores para procesar el error
    const processedError = errorService.processError(error, {
      context: 'tarifarioService.getTramosByCliente'
    });
    
    // Lanzar el error procesado
    throw processedError;
  }
};

/**
 * Obtiene sitios por cliente
 * @param {string} clienteId - ID del cliente
 * @returns {Promise<Array>} Array de sitios
 */
const getSitesByCliente = async (clienteId) => {
  if (!clienteId) {
    throw new Error('ID de cliente requerido');
  }
  
  // Intentar primero con la nueva ruta modularizada
  const urls = [
    `${BASE_URL}/site/cliente/${clienteId}`,  // Nueva ruta modularizada
    `${BASE_URL}/sites?cliente=${clienteId}`  // Ruta antigua como fallback
  ];
  
  let lastError = null;
  
  // Obtener sitios por cliente
  for (const url of urls) {
    logger.debug(`Solicitando sitios: ${url}`);
    
    try {
      const response = await api.get(url);
      
      // Verificar si la respuesta es válida
      if (!response) {
        logger.warn(`Respuesta vacía al obtener sitios desde ${url}`);
        continue; // Intentar con la siguiente URL
      }
      
      // Manejar diferentes formatos de respuesta
      if (Array.isArray(response)) {
        // Respuesta es directamente un array
        logger.debug(`Sitios recibidos (array directo): ${response.length}`);
        return response;
      } else if (Array.isArray(response.data)) {
        // data es directamente un array
        logger.debug(`Sitios recibidos (array directo): ${response.data.length}`);
        return response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // formato anidado: response.data.data es un array
        logger.debug(`Sitios recibidos (formato objeto): ${response.data.data.length}`);
        return response.data.data;
      } else if (response.success === true) {
        // Nuevo formato estándar del backend
        logger.debug(`Sitios recibidos (formato nuevo): ${response.data?.length || 0}`);
        return response.data || [];
      }
      
      logger.warn('Formato de respuesta no reconocido para sitios', response);
      
    } catch (error) {
      logger.warn(`Error al obtener sitios desde ${url}:`, error);
      lastError = error;
      // Continuar con la siguiente URL
    }
  }
  
  // Si llegamos aquí, ninguna URL funcionó
  logger.error('Todas las URLs para obtener sitios fallaron');
  
  // Usar el servicio de errores para procesar el último error
  const processedError = errorService.processError(lastError || new Error('No se pudo obtener sitios de ninguna URL'), {
    context: 'tarifarioService.getSitesByCliente'
  });
  
  // Lanzar el error procesado
  throw processedError;
};

/**
 * Calcula distancia entre dos sitios
 * @param {string} origen - ID del sitio origen
 * @param {string} destino - ID del sitio destino
 * @returns {Promise<Object>} Información de distancia calculada
 */
const calcularDistancia = async (origen, destino) => {
  if (!origen || !destino) {
    throw new Error('Se requieren origen y destino para calcular distancia');
  }
  
  const url = `${BASE_URL}/tramo/calcular-distancia`;
  logger.debug(`Calculando distancia: ${url}`, { origen, destino });
  
  try {
    const response = await api.post(url, { origen, destino });
    
    // Verificar si la respuesta es válida
    if (!response || !response.data) {
      logger.error('Respuesta vacía al calcular distancia');
      throw new Error('No se recibió respuesta del servidor');
    }
    
    logger.debug('Distancia calculada:', response.data);
    return response.data;
  } catch (error) {
    // Usar el servicio de errores para procesar el error
    const processedError = errorService.processError(error, {
      context: 'tarifarioService.calcularDistancia'
    });
    
    // Lanzar el error procesado
    throw processedError;
  }
};

/**
 * Guarda un tramo nuevo o actualiza uno existente
 * @param {Object} tramo - Datos del tramo a guardar
 * @returns {Promise<Object>} Tramo guardado
 */
const guardarTramo = async (tramo) => {
  if (!tramo) {
    throw new Error('Datos de tramo requeridos');
  }
  
  const url = `${BASE_URL}/tramo`;
  const method = tramo._id ? 'put' : 'post';
  const endpoint = tramo._id ? `${url}/${tramo._id}` : url;
  
  logger.debug(`${method.toUpperCase()} ${endpoint}`, tramo);
  
  try {
    const response = await api[method](endpoint, tramo);
    
    // Verificar si la respuesta es válida
    if (!response || !response.data) {
      logger.error(`Respuesta vacía al ${tramo._id ? 'actualizar' : 'crear'} tramo`);
      throw new Error('No se recibió respuesta del servidor');
    }
    
    logger.debug('Tramo guardado:', response.data);
    return response.data;
  } catch (error) {
    // Usar el servicio de errores para procesar el error
    const processedError = errorService.processError(error, {
      context: 'tarifarioService.guardarTramo'
    });
    
    // Lanzar el error procesado
    throw processedError;
  }
};

// Exportar todas las funciones del servicio
export default {
  getTramosByCliente,
  getSitesByCliente,
  calcularDistancia,
  guardarTramo
}; 