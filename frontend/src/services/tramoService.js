import api from './api';

/**
 * Servicio para gestionar los tramos
 */
class TramoService {
  /**
   * Obtiene todos los tramos de un cliente
   * @param {string} clienteId - ID del cliente
   * @returns {Promise} - Promesa con los tramos
   */
  async getTramos(clienteId) {
    return await api.get(`/tramos/cliente/${clienteId}`);
  }

  /**
   * Crea un nuevo tramo
   * @param {Object} tramoData - Datos del tramo
   * @returns {Promise} - Promesa con el tramo creado
   */
  async createTramo(tramoData) {
    return await api.post('/tramos', tramoData);
  }

  /**
   * Actualiza un tramo existente
   * @param {string} tramoId - ID del tramo
   * @param {Object} tramoData - Datos actualizados del tramo
   * @returns {Promise} - Promesa con el tramo actualizado
   */
  async updateTramo(tramoId, tramoData) {
    return await api.put(`/tramos/${tramoId}`, tramoData);
  }

  /**
   * Elimina un tramo
   * @param {string} tramoId - ID del tramo
   * @returns {Promise} - Promesa con el resultado de la eliminación
   */
  async deleteTramo(tramoId) {
    return await api.delete(`/tramos/${tramoId}`);
  }

  /**
   * Importación masiva de tramos
   * @param {string} clienteId - ID del cliente
   * @param {Array} tramos - Lista de tramos a importar
   * @param {boolean} reutilizarDistancias - Indica si se deben reutilizar distancias pre-calculadas
   * @param {boolean} actualizarExistentes - Indica si se deben actualizar tramos existentes
   * @returns {Promise} - Promesa con el resultado de la importación
   */
  async bulkImportTramos(clienteId, tramos, reutilizarDistancias = true, actualizarExistentes = false) {
    return await api.post('/api/tramos/bulk', {
      cliente: clienteId,
      tramos,
      reutilizarDistancias,
      actualizarExistentes
    });
  }

  /**
   * Importa tramos desde un archivo Excel
   * @param {File} file - Archivo Excel
   * @param {string} clienteId - ID del cliente
   * @param {boolean} reutilizarDistancias - Indica si se deben reutilizar distancias pre-calculadas
   * @param {boolean} actualizarExistentes - Indica si se deben actualizar tramos existentes
   * @returns {Promise} - Promesa con el resultado de la importación
   */
  async importFromExcel(file, clienteId, reutilizarDistancias = true, actualizarExistentes = false) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cliente', clienteId);
    formData.append('reutilizarDistancias', reutilizarDistancias);
    formData.append('actualizarExistentes', actualizarExistentes);

    return await api.post('/tramos/import/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
}

export default new TramoService(); 