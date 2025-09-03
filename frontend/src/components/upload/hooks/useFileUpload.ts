import { useState } from 'react';
import { ArchivoSubido, generatePreview } from '../utils/fileUtils';
import { validateFile } from '../utils/fileValidation';
import {
  showSuccessNotification,
  showErrorNotification,
  showConnectionErrorNotification,
  updateArchivosEstado,
  startProgressSimulation,
} from '../services/uploadService';

interface UseFileUploadProps {
  accept: string[];
  maxSize: number;
  onUpload: (files: File[]) => Promise<{ success: boolean; urls?: string[]; error?: string }>;
  onRemove?: (fileId: string) => void;
  onPreview?: (file: File) => void;
}

const createArchivoFromFile = async (file: File): Promise<ArchivoSubido> => {
  const preview = await generatePreview(file);

  return {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    file,
    nombre: file.name,
    tamaño: file.size,
    tipo: file.type,
    estado: 'pendiente',
    progreso: 0,
    preview: preview || undefined,
  };
};

export const useFileUpload = ({
  accept,
  maxSize,
  onUpload,
  onRemove,
  onPreview,
}: UseFileUploadProps) => {
  const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);

  const processValidFiles = async (files: File[]) => {
    const validFiles = [];

    for (const file of files) {
      if (validateFile(file, accept, maxSize)) {
        const archivo = await createArchivoFromFile(file);
        validFiles.push(archivo);
      }
    }

    return validFiles;
  };

  const handleSuccessfulUpload = (files: File[], resultado: { urls?: string[] }) => {
    files.forEach((file, index) => {
      updateArchivosEstado(setArchivos, [file], {
        estado: 'completado',
        progreso: 100,
        url: resultado.urls?.[index],
      });
    });
    showSuccessNotification(files.length);
  };

  const handleFailedUpload = (files: File[], error?: string) => {
    updateArchivosEstado(setArchivos, files, {
      estado: 'error',
      progreso: 0,
      error: error || 'Error al subir archivo',
    });
    showErrorNotification(error);
  };

  const handleConnectionError = (files: File[]) => {
    updateArchivosEstado(setArchivos, files, {
      estado: 'error',
      progreso: 0,
      error: 'Error de conexión',
    });
    showConnectionErrorNotification();
  };

  const subirArchivos = async (files: File[]) => {
    updateArchivosEstado(setArchivos, files, { estado: 'subiendo', progreso: 0 });
    const interval = startProgressSimulation(setArchivos, files);

    try {
      const resultado = await onUpload(files);
      clearInterval(interval);

      if (resultado.success) {
        handleSuccessfulUpload(files, resultado);
      } else {
        handleFailedUpload(files, resultado.error);
      }
    } catch (error) {
      clearInterval(interval);
      handleConnectionError(files);
    }
  };

  const handleDrop = async (files: File[]) => {
    const nuevosArchivos = await processValidFiles(files);

    if (nuevosArchivos.length > 0) {
      setArchivos((prev) => [...prev, ...nuevosArchivos]);
      subirArchivos(nuevosArchivos.map((a) => a.file));
    }
  };

  const handleRemove = (archivoId: string) => {
    setArchivos((prev) => prev.filter((a) => a.id !== archivoId));
    onRemove?.(archivoId);
  };

  const handlePreview = (archivo: ArchivoSubido) => {
    onPreview?.(archivo.file);
  };

  const handleDownload = (archivo: ArchivoSubido) => {
    if (archivo.url) {
      const link = document.createElement('a');
      link.href = archivo.url;
      link.download = archivo.nombre;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return {
    archivos,
    handleDrop,
    handleRemove,
    handlePreview,
    handleDownload,
  };
};
