/**
 * @module services/clienteService
 * @description Servicio para gestionar clientes en la aplicación
 */

import api from './api/index';

const BASE_PATH = '/api/clientes';

/**
 * Servicio para gestionar clientes
 */
const clienteService = {
  /**
   * Obtiene todos los clientes disponibles
   * @returns {Promise<Array>} Lista de clientes
   */
  getClientes: async () => {
    return api.get(BASE_PATH);
  },

  /**
   * Obtiene un cliente por su ID
   * @param {string} id - ID del cliente
   * @returns {Promise<Object>} Datos del cliente
   */
  getClienteById: async (id) => {
    return api.get(`${BASE_PATH}/${id}`);
  },

  /**
   * Crea un nuevo cliente
   * @param {Object} cliente - Datos del cliente a crear
   * @returns {Promise<Object>} Cliente creado
   */
  createCliente: async (cliente) => {
    return api.post(BASE_PATH, cliente);
  },

  /**
   * Actualiza un cliente existente
   * @param {string} id - ID del cliente a actualizar
   * @param {Object} cliente - Datos actualizados del cliente
   * @returns {Promise<Object>} Cliente actualizado
   */
  updateCliente: async (id, cliente) => {
    return api.put(`${BASE_PATH}/${id}`, cliente);
  },

  /**
   * Elimina un cliente
   * @param {string} id - ID del cliente a eliminar
   * @returns {Promise<Object>} Respuesta de la operación
   */
  deleteCliente: async (id) => {
    return api.delete(`${BASE_PATH}/${id}`);
  },

  /**
   * Actualiza las fórmulas de cálculo de un cliente
   * @param {string} id - ID del cliente
   * @param {Object} formulas - Fórmulas actualizadas
   * @returns {Promise<Object>} Cliente actualizado
   */
  updateFormulas: async (id, formulas) => {
    return api.put(`${BASE_PATH}/${id}`, formulas);
  },

  /**
   * Obtiene los sitios de un cliente específico
   * @param {string} clienteNombre - Nombre del cliente
   * @returns {Promise<Array>} Lista de sitios del cliente
   */
  getSitiosByCliente: async (clienteNombre) => {
    return api.get(`${BASE_PATH}/sitios/${clienteNombre}`);
  },

  /**
   * Obtiene los extras de un cliente específico
   * @param {string} clienteNombre - Nombre del cliente
   * @returns {Promise<Array>} Lista de extras del cliente
   */
  getExtrasByCliente: async (clienteNombre) => {
    return api.get(`${BASE_PATH}/extras/${clienteNombre}`);
  }
};

export default clienteService; 