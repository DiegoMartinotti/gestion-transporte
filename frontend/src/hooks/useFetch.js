/**
 * @module hooks/useFetch
 * @description Hook personalizado para realizar peticiones HTTP
 */

import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

/**
 * Hook para realizar peticiones HTTP de forma simplificada
 * 
 * @param {string} url - URL a la que hacer la petición
 * @param {Object} options - Opciones adicionales
 * @param {boolean} options.immediate - Si se debe realizar la petición inmediatamente
 * @param {Object} options.initialData - Datos iniciales antes de la petición
 * @param {Object} options.headers - Cabeceras HTTP adicionales
 * @returns {Object} Estado y métodos para manejar la petición
 * 
 * @example
 * const { data, loading, error, execute } = useFetch(
 *   'https://api.example.com/data',
 *   { immediate: true }
 * );
 */
const useFetch = (url, { immediate = false, initialData = null, headers = {} } = {}) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const [controller, setController] = useState(null);

  // Preparar cabeceras con token de autenticación si existe
  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    return { ...authHeaders, ...headers };
  }, [headers]);

  /**
   * Ejecuta la petición GET
   */
  const get = useCallback(async (params = {}) => {
    // Cancelar petición anterior si existe
    if (controller) {
      controller.abort();
    }

    // Crear nuevo controlador para esta petición
    const newController = new AbortController();
    setController(newController);

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(url, {
        params,
        headers: getHeaders(),
        signal: newController.signal
      });
      
      setData(response.data);
      return response.data;
    } catch (err) {
      if (!axios.isCancel(err)) {
        setError(err.response?.data?.error || err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }, [url, getHeaders, controller]);

  /**
   * Ejecuta una petición POST
   */
  const post = useCallback(async (body = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(url, body, {
        headers: getHeaders()
      });
      
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, getHeaders]);

  /**
   * Ejecuta una petición PUT
   */
  const put = useCallback(async (body = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.put(url, body, {
        headers: getHeaders()
      });
      
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, getHeaders]);

  /**
   * Ejecuta una petición DELETE
   */
  const del = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.delete(url, {
        headers: getHeaders()
      });
      
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, getHeaders]);

  // Realizar petición automáticamente si immediate=true
  useEffect(() => {
    if (immediate) {
      get();
    }
    
    // Limpiar controlador al desmontar
    return () => {
      if (controller) {
        controller.abort();
      }
    };
  }, [immediate, get, controller]);

  return {
    data,
    loading,
    error,
    get,
    post,
    put,
    delete: del, // Alias ya que delete es palabra reservada
    refetch: get // Alias para hacer más intuitivo el refresco
  };
};

export default useFetch; 