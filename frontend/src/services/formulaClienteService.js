/**
 * @module services/formulaClienteService
 * @description Servicio para gestionar fórmulas personalizadas de cliente con historial versionado
 */

import api from './api/index';

const BASE_PATH = '/api/formulas';

/**
 * Servicio para gestionar fórmulas personalizadas de cliente
 */
const formulaClienteService = {
  /**
   * Obtiene todas las fórmulas de un cliente específico
   * @param {string} clienteId - ID del cliente
   * @param {Object} params - Parámetros opcionales (tipoUnidad, fecha)
   * @returns {Promise<Array>} Lista de fórmulas
   */
  getFormulasByCliente: async (clienteId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.tipoUnidad) queryParams.append('tipoUnidad', params.tipoUnidad);
    if (params.fecha) queryParams.append('fecha', params.fecha);
    
    const queryString = queryParams.toString();
    const url = `${BASE_PATH}/cliente/${clienteId}${queryString ? `?${queryString}` : ''}`;
    
    return api.get(url);
  },

  /**
   * Crea una nueva fórmula personalizada
   * @param {Object} formula - Datos de la fórmula a crear
   * @returns {Promise<Object>} Fórmula creada
   */
  createFormula: async (formula) => {
    return api.post(BASE_PATH, formula);
  },

  /**
   * Actualiza una fórmula existente
   * @param {string} id - ID de la fórmula a actualizar
   * @param {Object} formula - Datos actualizados
   * @returns {Promise<Object>} Fórmula actualizada
   */
  updateFormula: async (id, formula) => {
    return api.put(`${BASE_PATH}/${id}`, formula);
  },

  /**
   * Elimina una fórmula
   * @param {string} id - ID de la fórmula a eliminar
   * @returns {Promise<Object>} Respuesta de la operación
   */
  deleteFormula: async (id) => {
    return api.delete(`${BASE_PATH}/${id}`);
  }
};

export default formulaClienteService; 