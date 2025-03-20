/**
 * @module services/vehiculoService
 * @description Servicio para gestionar vehículos en la aplicación
 */

import api from './api';
import cacheService from '../utils/cacheUtils';

const BASE_PATH = '/api/vehiculos';

// Prefijo para todas las claves de caché de vehículos
const CACHE_PREFIX = 'vehiculos_';

// Tiempo de expiración específico para vehículos (7 minutos)
const CACHE_TIEMPO_VEHICULOS = 7 * 60 * 1000;

/**
 * Elimina todas las entradas de caché relacionadas con vehículos
 */
const invalidarCacheVehiculos = () => {
  return cacheService.eliminarPorPatron(CACHE_PREFIX);
};

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
    // Construimos una clave de caché que incluya los parámetros de filtrado
    const claveFiltros = Object.entries(params)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${k}-${v}`)
      .join('_');
      
    const cacheKey = `${CACHE_PREFIX}lista_${claveFiltros || 'todos'}`;
    
    return cacheService.obtenerOCargar(
      cacheKey,
      async () => {
        console.log('Parámetros de búsqueda:', params);
        try {
          const response = await api.get(BASE_PATH, params);
          console.log('Respuesta de API vehículos:', response);
          return response;
        } catch (error) {
          console.error('Error al obtener vehículos:', error);
          throw error;
        }
      },
      { tiempoExpiracion: CACHE_TIEMPO_VEHICULOS }
    );
  },

  /**
   * Obtiene los vehículos de una empresa específica
   * @param {string} empresaId - ID de la empresa
   * @returns {Promise<Array>} Lista de vehículos de la empresa
   */
  getVehiculosByEmpresa: async (empresaId) => {
    if (!empresaId) {
      throw new Error('Se requiere el ID de la empresa');
    }
    
    const cacheKey = `${CACHE_PREFIX}empresa_${empresaId}`;
    
    return cacheService.obtenerOCargar(
      cacheKey,
      async () => {
        console.log('Obteniendo vehículos para empresa:', empresaId);
        try {
          const response = await api.get(`${BASE_PATH}/empresa/${empresaId}`);
          console.log('Respuesta de API vehículos por empresa:', response);
          return response;
        } catch (error) {
          console.error(`Error al obtener vehículos de empresa ${empresaId}:`, error);
          throw error;
        }
      },
      { tiempoExpiracion: CACHE_TIEMPO_VEHICULOS }
    );
  },

  /**
   * Obtiene un vehículo por su ID
   * @param {string} id - ID del vehículo
   * @returns {Promise<Object>} Datos del vehículo
   */
  getVehiculoById: async (id) => {
    if (!id) {
      throw new Error('Se requiere el ID del vehículo');
    }
    
    return cacheService.obtenerOCargar(
      `${CACHE_PREFIX}id_${id}`,
      async () => api.get(`${BASE_PATH}/${id}`),
      { tiempoExpiracion: CACHE_TIEMPO_VEHICULOS }
    );
  },

  /**
   * Crea un nuevo vehículo
   * @param {Object} vehiculo - Datos del vehículo a crear
   * @returns {Promise<Object>} Vehículo creado
   */
  createVehiculo: async (vehiculo) => {
    if (!vehiculo || !vehiculo.dominio || !vehiculo.empresa) {
      throw new Error('Los datos del vehículo son incompletos. Se requiere al menos dominio y empresa.');
    }
    
    try {
      const nuevoVehiculo = await api.post(BASE_PATH, vehiculo);
      
      // Invalidamos la caché porque hemos modificado datos
      invalidarCacheVehiculos();
      
      return nuevoVehiculo;
    } catch (error) {
      console.error('Error al crear vehículo:', error);
      throw error;
    }
  },

  /**
   * Actualiza un vehículo existente
   * @param {string} id - ID del vehículo a actualizar
   * @param {Object} vehiculo - Datos actualizados del vehículo
   * @returns {Promise<Object>} Vehículo actualizado
   */
  updateVehiculo: async (id, vehiculo) => {
    if (!id) {
      throw new Error('Se requiere el ID del vehículo');
    }
    
    if (!vehiculo) {
      throw new Error('Se requieren datos para actualizar el vehículo');
    }
    
    try {
      const vehiculoActualizado = await api.put(`${BASE_PATH}/${id}`, vehiculo);
      
      // Invalidamos la caché porque hemos modificado datos
      invalidarCacheVehiculos();
      
      return vehiculoActualizado;
    } catch (error) {
      console.error(`Error al actualizar vehículo ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un vehículo
   * @param {string} id - ID del vehículo a eliminar
   * @returns {Promise<Object>} Respuesta de la operación
   */
  deleteVehiculo: async (id) => {
    if (!id) {
      throw new Error('Se requiere el ID del vehículo');
    }
    
    try {
      const resultado = await api.delete(`${BASE_PATH}/${id}`);
      
      // Invalidamos la caché porque hemos modificado datos
      invalidarCacheVehiculos();
      
      return resultado;
    } catch (error) {
      console.error(`Error al eliminar vehículo ${id}:`, error);
      throw error;
    }
  },

  /**
   * Carga masiva de vehículos desde un array de datos
   * @param {Array} vehiculos - Lista de vehículos a cargar
   * @returns {Promise<Object>} Resultado de la operación
   */
  bulkUploadVehiculos: async (vehiculos) => {
    if (!vehiculos || !Array.isArray(vehiculos) || vehiculos.length === 0) {
      throw new Error('Se requiere una lista de vehículos para la carga masiva');
    }
    
    try {
      const resultado = await api.post(`${BASE_PATH}/bulk`, { vehiculos });
      
      // Invalidamos la caché porque hemos modificado datos
      invalidarCacheVehiculos();
      
      return resultado;
    } catch (error) {
      console.error('Error en la carga masiva de vehículos:', error);
      throw error;
    }
  },

  /**
   * Obtiene los tipos de vehículos disponibles
   * @returns {Promise<Array>} Lista de tipos de vehículos
   */
  getTiposVehiculo: async () => {
    return cacheService.obtenerOCargar(
      `${CACHE_PREFIX}tipos`,
      async () => api.get(`${BASE_PATH}/tipos`),
      { tiempoExpiracion: 24 * 60 * 60 * 1000 } // 24 horas (cambia poco)
    );
  },

  /**
   * Obtiene estadísticas sobre los vehículos
   * @returns {Promise<Object>} Estadísticas de vehículos
   */
  getEstadisticas: async () => {
    return cacheService.obtenerOCargar(
      `${CACHE_PREFIX}estadisticas`,
      async () => api.get(`${BASE_PATH}/estadisticas`),
      { tiempoExpiracion: 30 * 60 * 1000 } // 30 minutos
    );
  },

  /**
   * Actualiza el estado de activación de un vehículo
   * @param {string} id - ID del vehículo
   * @param {boolean} activo - Nuevo estado de activación
   * @returns {Promise<Object>} Vehículo actualizado
   */
  toggleActivoVehiculo: async (id, activo) => {
    if (!id) {
      throw new Error('Se requiere el ID del vehículo');
    }
    
    if (activo === undefined || activo === null) {
      throw new Error('Se requiere especificar el estado de activación');
    }
    
    try {
      const resultado = await api.patch(`${BASE_PATH}/${id}/activo`, { activo });
      
      // Invalidamos la caché porque hemos modificado datos
      invalidarCacheVehiculos();
      
      return resultado;
    } catch (error) {
      console.error(`Error al cambiar estado activo del vehículo ${id}:`, error);
      throw error;
    }
  },

  /**
   * Busca vehículos por dominio/patente
   * @param {string} dominio - Dominio/patente a buscar
   * @returns {Promise<Array>} Vehículos encontrados
   */
  buscarPorDominio: async (dominio) => {
    if (!dominio || dominio.trim() === '') {
      throw new Error('Se requiere especificar un dominio para buscar');
    }
    
    try {
      return await api.get(`${BASE_PATH}/buscar`, { dominio });
    } catch (error) {
      console.error(`Error al buscar vehículo por dominio ${dominio}:`, error);
      throw error;
    }
  },
  
  /**
   * Invalida manualmente la caché de vehículos
   */
  invalidarCache: invalidarCacheVehiculos
};

export default vehiculoService; 