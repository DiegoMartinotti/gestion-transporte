/**
 * @module services/vehiculoService
 * @description Servicio para gestionar vehículos en la aplicación
 */

import api from './api';

const BASE_PATH = '/api/vehiculos';

/**
 * Servicio para gestionar vehículos
 */
const vehiculoService = {
  /**
   * Obtiene todos los vehículos disponibles
   * @param {Object} params - Parámetros para filtrar la búsqueda
   * @returns {Promise<Array>} Lista de vehículos
   */
  getVehiculos: async (params = {}) => {
    return api.get(BASE_PATH, params);
  },

  /**
   * Obtiene un vehículo por su ID
   * @param {string} id - ID del vehículo
   * @returns {Promise<Object>} Datos del vehículo
   */
  getVehiculoById: async (id) => {
    return api.get(`${BASE_PATH}/${id}`);
  },

  /**
   * Crea un nuevo vehículo
   * @param {Object} vehiculo - Datos del vehículo a crear
   * @returns {Promise<Object>} Vehículo creado
   */
  createVehiculo: async (vehiculo) => {
    return api.post(BASE_PATH, vehiculo);
  },

  /**
   * Actualiza un vehículo existente
   * @param {string} id - ID del vehículo a actualizar
   * @param {Object} vehiculo - Datos actualizados del vehículo
   * @returns {Promise<Object>} Vehículo actualizado
   */
  updateVehiculo: async (id, vehiculo) => {
    return api.put(`${BASE_PATH}/${id}`, vehiculo);
  },

  /**
   * Elimina un vehículo
   * @param {string} id - ID del vehículo a eliminar
   * @returns {Promise<Object>} Respuesta de la operación
   */
  deleteVehiculo: async (id) => {
    return api.delete(`${BASE_PATH}/${id}`);
  },

  /**
   * Carga masiva de vehículos desde un array de datos
   * @param {Array} vehiculos - Lista de vehículos a cargar
   * @returns {Promise<Object>} Resultado de la operación
   */
  bulkUploadVehiculos: async (vehiculos) => {
    return api.post(`${BASE_PATH}/bulk`, { vehiculos });
  },

  /**
   * Obtiene los tipos de vehículos disponibles
   * @returns {Promise<Array>} Lista de tipos de vehículos
   */
  getTiposVehiculo: async () => {
    return api.get(`${BASE_PATH}/tipos`);
  },

  /**
   * Obtiene estadísticas sobre los vehículos
   * @returns {Promise<Object>} Estadísticas de vehículos
   */
  getEstadisticas: async () => {
    return api.get(`${BASE_PATH}/estadisticas`);
  },

  /**
   * Actualiza el estado de activación de un vehículo
   * @param {string} id - ID del vehículo
   * @param {boolean} activo - Nuevo estado de activación
   * @returns {Promise<Object>} Vehículo actualizado
   */
  toggleActivoVehiculo: async (id, activo) => {
    return api.patch(`${BASE_PATH}/${id}/activo`, { activo });
  },

  /**
   * Busca vehículos por dominio/patente
   * @param {string} dominio - Dominio/patente a buscar
   * @returns {Promise<Array>} Vehículos encontrados
   */
  buscarPorDominio: async (dominio) => {
    return api.get(`${BASE_PATH}/buscar`, { dominio });
  }
};

export default vehiculoService; 