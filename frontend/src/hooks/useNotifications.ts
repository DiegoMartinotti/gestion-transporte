import { useCallback, useRef } from 'react';
import { notifications } from '@mantine/notifications';

export interface NotificationOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  autoClose?: number | false;
  withCloseButton?: boolean;
  loading?: boolean;
  persistent?: boolean;
  id?: string;
}

export interface NotificationUpdate {
  id: string;
  title?: string;
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  loading?: boolean;
  autoClose?: number | false;
}

const NOTIFICATION_COLORS = {
  success: 'green',
  error: 'red',
  warning: 'orange',
  info: 'blue'
};

const DEFAULT_AUTO_CLOSE = {
  success: 5000,
  error: 8000,
  warning: 6000,
  info: 5000
};

export function useNotifications() {
  const notificationTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const show = useCallback((options: NotificationOptions) => {
    const {
      title,
      message,
      type = 'info',
      autoClose,
      withCloseButton = true,
      loading = false,
      persistent = false,
      id
    } = options;

    const notificationId = id || `notification-${Date.now()}-${Math.random()}`;
    
    const finalAutoClose = persistent ? false : (autoClose !== undefined ? autoClose : DEFAULT_AUTO_CLOSE[type]);

    notifications.show({
      id: notificationId,
      title,
      message,
      color: NOTIFICATION_COLORS[type],
      autoClose: finalAutoClose,
      withCloseButton,
      loading
    });

    // Si es persistent, configurar limpieza manual después de tiempo extendido
    if (persistent && finalAutoClose !== false) {
      const timer = setTimeout(() => {
        notifications.hide(notificationId);
        notificationTimers.current.delete(notificationId);
      }, finalAutoClose);
      
      notificationTimers.current.set(notificationId, timer);
    }

    return notificationId;
  }, []);

  const update = useCallback((updateData: NotificationUpdate) => {
    const { id, title, message, type = 'info', loading, autoClose } = updateData;

    notifications.update({
      id,
      title,
      message,
      color: NOTIFICATION_COLORS[type],
      autoClose: autoClose !== undefined ? autoClose : DEFAULT_AUTO_CLOSE[type],
      loading
    });
  }, []);

  const hide = useCallback((id: string) => {
    notifications.hide(id);
    
    // Limpiar timer si existe
    const timer = notificationTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      notificationTimers.current.delete(id);
    }
  }, []);

  const hideAll = useCallback(() => {
    notifications.clean();
    
    // Limpiar todos los timers
    notificationTimers.current.forEach(timer => clearTimeout(timer));
    notificationTimers.current.clear();
  }, []);

  // Métodos de conveniencia
  const success = useCallback((message: string, title?: string, options?: Partial<NotificationOptions>) => {
    return show({ ...options, message, title, type: 'success' });
  }, [show]);

  const error = useCallback((message: string, title?: string, options?: Partial<NotificationOptions>) => {
    return show({ ...options, message, title, type: 'error' });
  }, [show]);

  const warning = useCallback((message: string, title?: string, options?: Partial<NotificationOptions>) => {
    return show({ ...options, message, title, type: 'warning' });
  }, [show]);

  const info = useCallback((message: string, title?: string, options?: Partial<NotificationOptions>) => {
    return show({ ...options, message, title, type: 'info' });
  }, [show]);

  // Notificaciones especializadas para operaciones comunes
  const showOperation = useCallback((operation: string, loadingMessage: string) => {
    const id = show({
      title: operation,
      message: loadingMessage,
      type: 'info',
      loading: true,
      autoClose: false
    });

    return {
      success: (message: string) => update({ id, type: 'success', message, loading: false }),
      error: (message: string) => update({ id, type: 'error', message, loading: false }),
      warning: (message: string) => update({ id, type: 'warning', message, loading: false }),
      hide: () => hide(id)
    };
  }, [show, update, hide]);

  const showFormValidation = useCallback((errors: string[]) => {
    return error(
      `Se encontraron ${errors.length} error${errors.length > 1 ? 'es' : ''}:\n${errors.join('\n')}`,
      'Errores de Validación',
      { autoClose: 10000 }
    );
  }, [error]);

  const showApiError = useCallback((error: any, operation: string = 'operación') => {
    const message = error?.response?.data?.message || error?.message || `Error en ${operation}`;
    const title = `Error en ${operation}`;
    
    return show({
      title,
      message,
      type: 'error',
      autoClose: 8000,
      persistent: true
    });
  }, [show]);

  const showConfirmation = useCallback((message: string, title: string = 'Operación Exitosa') => {
    return success(message, title, { autoClose: 4000 });
  }, [success]);

  return {
    // Métodos básicos
    show,
    update,
    hide,
    hideAll,
    
    // Métodos por tipo
    success,
    error,
    warning,
    info,
    
    // Métodos especializados
    showOperation,
    showFormValidation,
    showApiError,
    showConfirmation
  };
}

export default useNotifications;