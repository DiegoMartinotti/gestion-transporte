/**
 * Servicio para la gestión del tarifario
 */
import api from './api';

const BASE_URL = '/api';

/**
 * Obtiene los tramos para un cliente específico
 * @param {string} clienteId - ID del cliente
 * @param {Object} filtros - Filtros de fecha opcionales
 * @returns {Promise} Promesa con los datos de tramos
 */
const getTramosByCliente = async (clienteId, filtros = {}) => {
  if (!clienteId) throw new Error('ID de cliente requerido');
  
  let url = `${BASE_URL}/tramos/cliente/${encodeURIComponent(clienteId)}`;
  
  // Añadir parámetros de filtro si están presentes
  if (filtros.desde && filtros.hasta) {
    url += `?desde=${filtros.desde}&hasta=${filtros.hasta}&incluirHistoricos=true`;
  }
  
  const response = await api.get(url);
  return response.data;
};

/**
 * Obtiene sitios para un cliente
 * @param {string} clienteId - ID del cliente
 * @returns {Promise} Promesa con los datos de sitios
 */
const getSitesByCliente = async (clienteId) => {
  if (!clienteId) throw new Error('ID de cliente requerido');
  
  const response = await api.get(`${BASE_URL}/sites?cliente=${clienteId}`);
  
  if (response.data && Array.isArray(response.data)) {
    return response.data;
  } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  
  throw new Error('Formato de respuesta no reconocido');
};

/**
 * Crea un nuevo tramo
 * @param {Object} tramoData - Datos del tramo a crear
 * @returns {Promise} Promesa con el resultado de la operación
 */
const createTramo = async (tramoData) => {
  const response = await api.post(`${BASE_URL}/tramos`, tramoData);
  return response.data;
};

/**
 * Actualiza un tramo existente
 * @param {string} tramoId - ID del tramo a actualizar
 * @param {Object} tramoData - Datos actualizados del tramo
 * @returns {Promise} Promesa con el resultado de la operación
 */
const updateTramo = async (tramoId, tramoData) => {
  const response = await api.put(`${BASE_URL}/tramos/${tramoId}`, tramoData);
  return response.data;
};

/**
 * Elimina un tramo
 * @param {string} tramoId - ID del tramo a eliminar
 * @returns {Promise} Promesa con el resultado de la operación
 */
const deleteTramo = async (tramoId) => {
  const response = await api.delete(`${BASE_URL}/tramos/${tramoId}`);
  return response.data;
};

/**
 * Actualiza la vigencia de múltiples tramos
 * @param {Array} tramoIds - IDs de los tramos a actualizar
 * @param {Object} vigenciaData - Datos de vigencia a actualizar
 * @returns {Promise} Promesa con el resultado de la operación
 */
const updateVigenciaMasiva = async (tramoIds, vigenciaData) => {
  const response = await api.put(`${BASE_URL}/tramos/actualizarVigencia`, {
    tramosIds: tramoIds,
    vigenciaDesde: vigenciaData.vigenciaDesde,
    vigenciaHasta: vigenciaData.vigenciaHasta
  });
  return response.data;
};

export default {
  getTramosByCliente,
  getSitesByCliente,
  createTramo,
  updateTramo,
  deleteTramo,
  updateVigenciaMasiva
}; 