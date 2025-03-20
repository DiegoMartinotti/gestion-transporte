/**
 * @module services/empresaService
 * @description Servicio para la gestión de empresas
 */

import api from './api';

const BASE_URL = '/api/empresas';

/**
 * Servicio para gestión de empresas
 */
const empresaService = {
  /**
   * Obtiene todas las empresas
   * @returns {Promise<Object>} Respuesta con las empresas
   */
  getAllEmpresas: () => {
    return api.get(`${BASE_URL}`);
  },

  /**
   * Obtiene una empresa por su ID
   * @param {string} id ID de la empresa
   * @returns {Promise<Object>} Respuesta con la empresa
   */
  getEmpresaById: (id) => {
    return api.get(`${BASE_URL}/${id}`);
  },

  /**
   * Crea una nueva empresa
   * @param {Object} empresaData Datos de la empresa a crear
   * @returns {Promise<Object>} Respuesta con la empresa creada
   */
  createEmpresa: (empresaData) => {
    return api.post(`${BASE_URL}`, empresaData);
  },

  /**
   * Actualiza una empresa existente
   * @param {string} id ID de la empresa
   * @param {Object} empresaData Datos actualizados de la empresa
   * @returns {Promise<Object>} Respuesta con la empresa actualizada
   */
  updateEmpresa: (id, empresaData) => {
    return api.put(`${BASE_URL}/${id}`, empresaData);
  },

  /**
   * Elimina una empresa
   * @param {string} id ID de la empresa
   * @returns {Promise<Object>} Respuesta de confirmación
   */
  deleteEmpresa: (id) => {
    return api.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Importa empresas en lote desde un archivo Excel
   * @param {Array} empresas Lista de empresas para importar
   * @returns {Promise<Object>} Respuesta con el resultado de la importación
   */
  bulkImportEmpresas: (empresas) => {
    return api.post(`${BASE_URL}/bulk`, empresas);
  },

  /**
   * Obtiene los vehículos asociados a una empresa
   * @param {string} empresaId ID de la empresa
   * @returns {Promise<Object>} Respuesta con los vehículos
   */
  getVehiculosByEmpresa: (empresaId) => {
    return api.get(`${BASE_URL}/${empresaId}/vehiculos`);
  },

  /**
   * Obtiene el personal asociado a una empresa
   * @param {string} empresaId ID de la empresa
   * @returns {Promise<Object>} Respuesta con el personal
   */
  getPersonalByEmpresa: (empresaId) => {
    return api.get(`${BASE_URL}/${empresaId}/personal`);
  }
};

export default empresaService; 