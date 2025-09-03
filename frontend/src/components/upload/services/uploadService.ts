import { notifications } from '@mantine/notifications';
import { ArchivoSubido } from '../utils/fileUtils';

export const showSuccessNotification = (fileCount: number) => {
  const singular = fileCount === 1;
  notifications.show({
    title: 'Archivos subidos',
    message: `${fileCount} archivo${singular ? '' : 's'} subido${singular ? '' : 's'} correctamente`,
    color: 'green',
  });
};

export const showErrorNotification = (error?: string) => {
  notifications.show({
    title: 'Error al subir archivos',
    message: error || 'Ocurrió un error inesperado',
    color: 'red',
  });
};

export const showConnectionErrorNotification = () => {
  notifications.show({
    title: 'Error de conexión',
    message: 'No se pudo conectar con el servidor',
    color: 'red',
  });
};

export const updateArchivosEstado = (
  setArchivos: React.Dispatch<React.SetStateAction<ArchivoSubido[]>>,
  targetFiles: File[],
  updates: Partial<ArchivoSubido>
) => {
  setArchivos((prev) =>
    prev.map((archivo) =>
      targetFiles.some((f) => f.name === archivo.file.name) ? { ...archivo, ...updates } : archivo
    )
  );
};

export const startProgressSimulation = (
  setArchivos: React.Dispatch<React.SetStateAction<ArchivoSubido[]>>,
  files: File[]
) => {
  const updateProgress = () => {
    setArchivos((prev) =>
      prev.map((archivo) =>
        files.some((f) => f.name === archivo.file.name) && archivo.estado === 'subiendo'
          ? { ...archivo, progreso: Math.min(archivo.progreso + 10, 90) }
          : archivo
      )
    );
  };

  return setInterval(updateProgress, 200);
};
