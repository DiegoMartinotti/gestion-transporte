/**
 * @module services/empresaService
 * @description Servicio para la gestión de empresas
 */

import api from './api';
import cacheService from '../utils/cacheUtils';

const BASE_URL = '/api/empresas';

// Prefijo para todas las claves de caché de empresas
const CACHE_PREFIX = 'empresas_';

// Tiempo de expiración específico para empresas (10 minutos)
const CACHE_TIEMPO_EMPRESAS = 10 * 60 * 1000;

/**
 * Elimina todas las entradas de caché relacionadas con empresas
 */
const invalidarCacheEmpresas = () => {
  return cacheService.eliminarPorPatron(CACHE_PREFIX);
};

/**
 * Servicio para gestión de empresas
 */
const empresaService = {
  /**
   * Obtiene todas las empresas
   * @returns {Promise<Array>} Lista de empresas
   */
  getAllEmpresas: async () => {
    return cacheService.obtenerOCargar(
      `${CACHE_PREFIX}todas`,
      async () => {
        console.log('Solicitando todas las empresas a:', `${BASE_URL}`);
        try {
          const response = await api.get(`${BASE_URL}`);
          console.log('Respuesta completa de API empresas:', response);
          return response;
        } catch (error) {
          console.error('Error al obtener todas las empresas:', error);
          throw error;
        }
      },
      { tiempoExpiracion: CACHE_TIEMPO_EMPRESAS }
    );
  },

  /**
   * Obtiene una empresa por su ID
   * @param {string} id ID de la empresa
   * @returns {Promise<Object>} Datos de la empresa
   */
  getEmpresaById: async (id) => {
    if (!id) throw new Error('Se requiere el ID de la empresa');
    
    return cacheService.obtenerOCargar(
      `${CACHE_PREFIX}id_${id}`,
      async () => api.get(`${BASE_URL}/${id}`),
      { tiempoExpiracion: CACHE_TIEMPO_EMPRESAS }
    );
  },

  /**
   * Crea una nueva empresa
   * @param {Object} empresaData Datos de la empresa a crear
   * @returns {Promise<Object>} Empresa creada
   */
  createEmpresa: async (empresaData) => {
    if (!empresaData || !empresaData.nombre) {
      throw new Error('Se requiere al menos el nombre de la empresa');
    }
    
    try {
      const nuevaEmpresa = await api.post(`${BASE_URL}`, empresaData);
      
      // Invalidamos la caché porque hemos modificado datos
      invalidarCacheEmpresas();
      
      return nuevaEmpresa;
    } catch (error) {
      console.error('Error al crear empresa:', error);
      throw error;
    }
  },

  /**
   * Actualiza una empresa existente
   * @param {string} id ID de la empresa
   * @param {Object} empresaData Datos actualizados de la empresa
   * @returns {Promise<Object>} Empresa actualizada
   */
  updateEmpresa: async (id, empresaData) => {
    if (!id) throw new Error('Se requiere el ID de la empresa');
    if (!empresaData) throw new Error('Se requieren datos para actualizar');
    
    try {
      const empresaActualizada = await api.put(`${BASE_URL}/${id}`, empresaData);
      
      // Invalidamos la caché porque hemos modificado datos
      invalidarCacheEmpresas();
      
      return empresaActualizada;
    } catch (error) {
      console.error(`Error al actualizar empresa ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina una empresa
   * @param {string} id ID de la empresa
   * @returns {Promise<Object>} Respuesta de confirmación
   */
  deleteEmpresa: async (id) => {
    if (!id) throw new Error('Se requiere el ID de la empresa');
    
    try {
      const resultado = await api.delete(`${BASE_URL}/${id}`);
      
      // Invalidamos la caché porque hemos modificado datos
      invalidarCacheEmpresas();
      
      return resultado;
    } catch (error) {
      console.error(`Error al eliminar empresa ${id}:`, error);
      throw error;
    }
  },

  /**
   * Importa empresas en lote desde un archivo Excel
   * @param {Array} empresas Lista de empresas para importar
   * @returns {Promise<Object>} Respuesta con el resultado de la importación
   */
  bulkImportEmpresas: async (empresas) => {
    if (!empresas || !Array.isArray(empresas) || empresas.length === 0) {
      throw new Error('Se requiere una lista de empresas para importar');
    }
    
    try {
      const resultado = await api.post(`${BASE_URL}/bulk`, empresas);
      
      // Invalidamos la caché porque hemos modificado datos
      invalidarCacheEmpresas();
      
      return resultado;
    } catch (error) {
      console.error('Error en la importación masiva de empresas:', error);
      throw error;
    }
  },

  /**
   * Obtiene los vehículos asociados a una empresa
   * @param {string} empresaId ID de la empresa
   * @returns {Promise<Array>} Lista de vehículos
   */
  getVehiculosByEmpresa: async (empresaId) => {
    if (!empresaId) throw new Error('Se requiere el ID de la empresa');
    
    return cacheService.obtenerOCargar(
      `${CACHE_PREFIX}vehiculos_${empresaId}`,
      async () => api.get(`${BASE_URL}/${empresaId}/vehiculos`),
      { tiempoExpiracion: 5 * 60 * 1000 } // 5 minutos
    );
  },

  /**
   * Obtiene el personal asociado a una empresa
   * @param {string} empresaId ID de la empresa
   * @returns {Promise<Array>} Lista de personal
   */
  getPersonalByEmpresa: async (empresaId) => {
    if (!empresaId) throw new Error('Se requiere el ID de la empresa');
    
    return cacheService.obtenerOCargar(
      `${CACHE_PREFIX}personal_${empresaId}`,
      async () => api.get(`${BASE_URL}/${empresaId}/personal`),
      { tiempoExpiracion: 5 * 60 * 1000 } // 5 minutos
    );
  },
  
  /**
   * Invalida manualmente la caché de empresas
   */
  invalidarCache: invalidarCacheEmpresas
};

export default empresaService; 