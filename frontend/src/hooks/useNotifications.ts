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

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const NOTIFICATION_COLORS = {
  success: 'green',
  error: 'red',
  warning: 'orange',
  info: 'blue',
};

const DEFAULT_AUTO_CLOSE = {
  success: 5000,
  error: 8000,
  warning: 6000,
  info: 5000,
};

// Helper functions extractos para reducir el tamaño de la función principal
const createNotificationId = (id?: string): string => {
  return id || `notification-${Date.now()}-${Math.random()}`;
};

const getAutoCloseTime = (
  persistent: boolean,
  autoClose: number | false | undefined,
  type: 'success' | 'error' | 'warning' | 'info'
): number | false => {
  return persistent ? false : autoClose !== undefined ? autoClose : DEFAULT_AUTO_CLOSE[type];
};

const setupPersistentTimer = (
  persistent: boolean,
  finalAutoClose: number | false,
  notificationId: string,
  notificationTimers: React.MutableRefObject<Map<string, NodeJS.Timeout>>
): void => {
  if (persistent && finalAutoClose !== false) {
    const timer = setTimeout(() => {
      notifications.hide(notificationId);
      notificationTimers.current.delete(notificationId);
    }, finalAutoClose);

    notificationTimers.current.set(notificationId, timer);
  }
};

const cleanupTimer = (
  id: string,
  notificationTimers: React.MutableRefObject<Map<string, NodeJS.Timeout>>
): void => {
  const timer = notificationTimers.current.get(id);
  if (timer) {
    clearTimeout(timer);
    notificationTimers.current.delete(id);
  }
};

const createConvenienceMethod =
  (
    show: (options: NotificationOptions) => string,
    type: 'success' | 'error' | 'warning' | 'info'
  ) =>
  (message: string, title?: string, options?: Partial<NotificationOptions>) => {
    return show({ ...options, message, title, type });
  };

const createOperationController =
  (
    show: (options: NotificationOptions) => string,
    update: (updateData: NotificationUpdate) => void,
    hide: (id: string) => void
  ) =>
  (operation: string, loadingMessage: string) => {
    const id = show({
      title: operation,
      message: loadingMessage,
      type: 'info',
      loading: true,
      autoClose: false,
    });

    return {
      success: (message: string) => update({ id, type: 'success', message, loading: false }),
      error: (message: string) => update({ id, type: 'error', message, loading: false }),
      warning: (message: string) => update({ id, type: 'warning', message, loading: false }),
      hide: () => hide(id),
    };
  };

const createSpecializedNotifications = (
  show: (options: NotificationOptions) => string,
  error: (message: string, title?: string, options?: Partial<NotificationOptions>) => string,
  success: (message: string, title?: string, options?: Partial<NotificationOptions>) => string
) => ({
  showFormValidation: (errors: string[]) => {
    return error(
      `Se encontraron ${errors.length} error${errors.length > 1 ? 'es' : ''}:\n${errors.join('\n')}`,
      'Errores de Validación',
      { autoClose: 10000 }
    );
  },

  showApiError: (error: unknown, operation = 'operación') => {
    const apiError = error as ApiError;
    const message =
      apiError?.response?.data?.message || apiError?.message || `Error en ${operation}`;
    const title = `Error en ${operation}`;

    return show({
      title,
      message,
      type: 'error',
      autoClose: 8000,
      persistent: true,
    });
  },

  showConfirmation: (message: string, title = 'Operación Exitosa') => {
    return success(message, title, { autoClose: 4000 });
  },
});

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
      id,
    } = options;

    const notificationId = createNotificationId(id);
    const finalAutoClose = getAutoCloseTime(persistent, autoClose, type);

    notifications.show({
      id: notificationId,
      title,
      message,
      color: NOTIFICATION_COLORS[type],
      autoClose: finalAutoClose,
      withCloseButton,
      loading,
    });

    setupPersistentTimer(persistent, finalAutoClose, notificationId, notificationTimers);
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
      loading,
    });
  }, []);

  const hide = useCallback((id: string) => {
    notifications.hide(id);
    cleanupTimer(id, notificationTimers);
  }, []);

  const hideAll = useCallback(() => {
    notifications.clean();
    notificationTimers.current.forEach((timer) => clearTimeout(timer));
    notificationTimers.current.clear();
  }, []);

  // Métodos de conveniencia
  const success = useCallback(
    (message: string, title?: string, options?: Partial<NotificationOptions>) => {
      return createConvenienceMethod(show, 'success')(message, title, options);
    },
    [show]
  );

  const error = useCallback(
    (message: string, title?: string, options?: Partial<NotificationOptions>) => {
      return createConvenienceMethod(show, 'error')(message, title, options);
    },
    [show]
  );

  const warning = useCallback(
    (message: string, title?: string, options?: Partial<NotificationOptions>) => {
      return createConvenienceMethod(show, 'warning')(message, title, options);
    },
    [show]
  );

  const info = useCallback(
    (message: string, title?: string, options?: Partial<NotificationOptions>) => {
      return createConvenienceMethod(show, 'info')(message, title, options);
    },
    [show]
  );

  // Operaciones especializadas
  const showOperation = useCallback(
    (operation: string, loadingMessage: string) => {
      return createOperationController(show, update, hide)(operation, loadingMessage);
    },
    [show, update, hide]
  );

  const { showFormValidation, showApiError, showConfirmation } = createSpecializedNotifications(
    show,
    error,
    success
  );

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
    showConfirmation,
  };
}

export default useNotifications;
