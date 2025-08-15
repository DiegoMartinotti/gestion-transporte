import { createElement } from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';

export const showSuccessNotification = (fileName: string): void => {
  notifications.show({
    title: 'Exportación exitosa',
    message: `Archivo ${fileName} descargado correctamente`,
    color: 'green',
    icon: createElement(IconCheck, { size: 16 }),
  });
};

export const showErrorNotification = (errorMessage: string): void => {
  notifications.show({
    title: 'Error de exportación',
    message: errorMessage,
    color: 'red',
    icon: createElement(IconX, { size: 16 }),
  });
};

export const showValidationError = (validationError: string): void => {
  notifications.show({
    title: 'Error de validación',
    message: validationError,
    color: 'red',
  });
};
