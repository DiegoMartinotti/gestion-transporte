import { notifications } from '@mantine/notifications';

export const validateFileSize = (file: File, maxSize: number): boolean => {
  const isValid = file.size <= maxSize * 1024 * 1024;

  if (!isValid) {
    notifications.show({
      title: 'Archivo muy grande',
      message: `${file.name} excede el tamaño máximo de ${maxSize}MB`,
      color: 'red',
    });
  }

  return isValid;
};

export const validateFileType = (file: File, accept: string[]): boolean => {
  const tipoValido = accept.some((acceptedType) => {
    if (acceptedType.includes('*')) {
      const baseType = acceptedType.split('/')[0];
      return file.type.startsWith(baseType);
    }
    return file.type === acceptedType;
  });

  if (!tipoValido) {
    notifications.show({
      title: 'Tipo de archivo no permitido',
      message: `${file.name} no es un tipo de archivo válido`,
      color: 'red',
    });
  }

  return tipoValido;
};

export const validateFile = (file: File, accept: string[], maxSize: number): boolean => {
  return validateFileSize(file, maxSize) && validateFileType(file, accept);
};
