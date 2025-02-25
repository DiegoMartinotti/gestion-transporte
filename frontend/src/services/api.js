// src/services/api.js
import axios from 'axios';
import { getAuthHeaders } from '../utils/auth';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // Usa la variable de entorno definida
});

const API_URL = process.env.REACT_APP_API_URL;

// Agregamos un interceptor de request para incluir el token en cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const fetchViajes = async () => {
  const response = await fetch(`${API_URL}/api/viajes`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Error al obtener viajes');
  return response.json();
};

export const updateViaje = async (dt, cliente, data) => {
  const response = await fetch(
    `${API_URL}/api/viajes?dt=${encodeURIComponent(dt)}&cliente=${encodeURIComponent(cliente)}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }
  );
  if (!response.ok) throw new Error('Error al actualizar viaje');
  return response.json();
};

export const deleteViaje = async (dt, cliente) => {
  const response = await fetch(
    `${API_URL}/api/viajes?dt=${encodeURIComponent(dt)}&cliente=${encodeURIComponent(cliente)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders()
    }
  );
  if (!response.ok) throw new Error('Error al eliminar viaje');
  return response.json();
};

export const bulkUploadViajes = async (viajes) => {
  const response = await fetch(`${API_URL}/api/viajes/bulk`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ viajes })
  });
  if (!response.ok) throw new Error('Error en la carga masiva');
  return response.json();
};

export default api;
