import { IconFileTypePdf, IconPhoto, IconFileText, IconFile } from '@tabler/icons-react';

export interface ArchivoSubido {
  id: string;
  file: File;
  nombre: string;
  tamaño: number;
  tipo: string;
  estado: 'pendiente' | 'subiendo' | 'completado' | 'error';
  progreso: number;
  url?: string;
  error?: string;
  preview?: string;
}

export const TIPOS_ARCHIVO_PERMITIDOS = {
  'application/pdf': { icon: IconFileTypePdf, color: 'red', label: 'PDF' },
  'image/jpeg': { icon: IconPhoto, color: 'blue', label: 'JPEG' },
  'image/jpg': { icon: IconPhoto, color: 'blue', label: 'JPG' },
  'image/png': { icon: IconPhoto, color: 'green', label: 'PNG' },
  'image/webp': { icon: IconPhoto, color: 'cyan', label: 'WebP' },
  'application/msword': { icon: IconFileText, color: 'indigo', label: 'DOC' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    icon: IconFileText,
    color: 'indigo',
    label: 'DOCX',
  },
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (tipo: string) => {
  const config = TIPOS_ARCHIVO_PERMITIDOS[tipo as keyof typeof TIPOS_ARCHIVO_PERMITIDOS];
  return config || { icon: IconFile, color: 'gray', label: 'Archivo' };
};

export const generatePreview = (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    } else {
      resolve(null);
    }
  });
};
