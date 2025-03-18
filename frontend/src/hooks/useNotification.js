/**
 * @module hooks/useNotification
 * @description Hook personalizado para manejar notificaciones
 */

import { useState, useCallback } from 'react';

/**
 * Hook para gestionar notificaciones en la aplicación
 * 
 * @returns {Object} Métodos y estado para manejar notificaciones
 * 
 * @example
 * // En un componente funcional
 * const {
 *   notification, 
 *   showNotification, 
 *   hideNotification
 * } = useNotification();
 * 
 * // Mostrar una notificación de éxito
 * showNotification('Operación completada', 'success');
 * 
 * // Uso típico en un componente React:
 * // Importar el componente Notification
 * // Usar los valores del hook para controlar el componente
 * // notification.open - controla la visibilidad
 * // notification.message - mensaje a mostrar
 * // notification.severity - tipo de notificación
 * // hideNotification - función para cerrar la notificación
 */
const useNotification = () => {
  // Estado para la notificación
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
    autoHideDuration: 6000
  });

  /**
   * Muestra una notificación
   * 
   * @param {string} message - Mensaje a mostrar
   * @param {string} severity - Tipo de notificación (success, error, warning, info)
   * @param {number} duration - Duración en milisegundos
   */
  const showNotification = useCallback((message, severity = 'info', duration = 6000) => {
    setNotification({
      open: true,
      message,
      severity,
      autoHideDuration: duration
    });
  }, []);

  /**
   * Oculta la notificación actual
   */
  const hideNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  }, []);

  /**
   * Métodos de conveniencia para diferentes tipos de notificaciones
   */
  const success = useCallback((message, duration) => {
    showNotification(message, 'success', duration);
  }, [showNotification]);

  const error = useCallback((message, duration) => {
    showNotification(message, 'error', duration);
  }, [showNotification]);

  const warning = useCallback((message, duration) => {
    showNotification(message, 'warning', duration);
  }, [showNotification]);

  const info = useCallback((message, duration) => {
    showNotification(message, 'info', duration);
  }, [showNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    success,
    error,
    warning,
    info
  };
};

export default useNotification; 