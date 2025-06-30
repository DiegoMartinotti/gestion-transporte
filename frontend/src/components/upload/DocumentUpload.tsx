import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Group,
  Text,
  Paper,
  Stack,
  Progress,
  Alert,
  Badge,
  ActionIcon,
  Tooltip,
  Card,
  Image,
  Modal,
  ScrollArea,
  ThemeIcon,
  List
} from '@mantine/core';
import {
  IconUpload,
  IconFile,
  IconX,
  IconDownload,
  IconEye,
  IconFileText,
  IconFileTypePdf,
  IconPhoto,
  IconCheck,
  IconExclamationMark,
  IconCloudUpload
} from '@tabler/icons-react';
import { Dropzone, DropzoneProps } from '@mantine/dropzone';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

interface ArchivoSubido {
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

interface DocumentUploadProps {
  multiple?: boolean;
  accept?: string[];
  maxSize?: number; // en MB
  onUpload: (files: File[]) => Promise<{ success: boolean; urls?: string[]; error?: string }>;
  onPreview?: (file: File) => void;
  onRemove?: (fileId: string) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  existingFiles?: Array<{
    id: string;
    nombre: string;
    url: string;
    tipo: string;
    tamaño?: number;
  }>;
}

const TIPOS_ARCHIVO_PERMITIDOS = {
  'application/pdf': { icon: IconFileTypePdf, color: 'red', label: 'PDF' },
  'image/jpeg': { icon: IconPhoto, color: 'blue', label: 'JPEG' },
  'image/jpg': { icon: IconPhoto, color: 'blue', label: 'JPG' },
  'image/png': { icon: IconPhoto, color: 'green', label: 'PNG' },
  'image/webp': { icon: IconPhoto, color: 'cyan', label: 'WebP' },
  'application/msword': { icon: IconFileText, color: 'indigo', label: 'DOC' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: IconFileText, color: 'indigo', label: 'DOCX' }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (tipo: string) => {
  const config = TIPOS_ARCHIVO_PERMITIDOS[tipo as keyof typeof TIPOS_ARCHIVO_PERMITIDOS];
  return config || { icon: IconFile, color: 'gray', label: 'Archivo' };
};

const generatePreview = (file: File): Promise<string | null> => {
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

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  multiple = false,
  accept = ['application/pdf', 'image/*'],
  maxSize = 10, // 10MB por defecto
  onUpload,
  onPreview,
  onRemove,
  disabled = false,
  label = 'Subir documentos',
  description = 'Arrastra archivos aquí o haz clic para seleccionar',
  existingFiles = []
}) => {
  const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);
  const [previewFile, setPreviewFile] = useState<ArchivoSubido | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = async (files: File[]) => {
    const nuevosArchivos: ArchivoSubido[] = [];

    for (const file of files) {
      // Validar tamaño
      if (file.size > maxSize * 1024 * 1024) {
        notifications.show({
          title: 'Archivo muy grande',
          message: `${file.name} excede el tamaño máximo de ${maxSize}MB`,
          color: 'red'
        });
        continue;
      }

      // Validar tipo
      const tipoValido = accept.some(acceptedType => {
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
          color: 'red'
        });
        continue;
      }

      const preview = await generatePreview(file);

      const archivo: ArchivoSubido = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        nombre: file.name,
        tamaño: file.size,
        tipo: file.type,
        estado: 'pendiente',
        progreso: 0,
        preview: preview || undefined
      };

      nuevosArchivos.push(archivo);
    }

    setArchivos(prev => [...prev, ...nuevosArchivos]);

    // Subir archivos automáticamente
    if (nuevosArchivos.length > 0) {
      subirArchivos(nuevosArchivos.map(a => a.file));
    }
  };

  const subirArchivos = async (files: File[]) => {
    // Actualizar estado a "subiendo"
    setArchivos(prev => prev.map(archivo => 
      files.some(f => f.name === archivo.file.name) 
        ? { ...archivo, estado: 'subiendo' as const, progreso: 0 }
        : archivo
    ));

    try {
      // Simular progreso de subida
      const interval = setInterval(() => {
        setArchivos(prev => prev.map(archivo => 
          files.some(f => f.name === archivo.file.name) && archivo.estado === 'subiendo'
            ? { ...archivo, progreso: Math.min(archivo.progreso + 10, 90) }
            : archivo
        ));
      }, 200);

      const resultado = await onUpload(files);

      clearInterval(interval);

      if (resultado.success) {
        setArchivos(prev => prev.map(archivo => 
          files.some(f => f.name === archivo.file.name)
            ? { 
                ...archivo, 
                estado: 'completado' as const, 
                progreso: 100,
                url: resultado.urls?.[files.findIndex(f => f.name === archivo.file.name)]
              }
            : archivo
        ));

        notifications.show({
          title: 'Archivos subidos',
          message: `${files.length} archivo${files.length > 1 ? 's' : ''} subido${files.length > 1 ? 's' : ''} correctamente`,
          color: 'green'
        });
      } else {
        setArchivos(prev => prev.map(archivo => 
          files.some(f => f.name === archivo.file.name)
            ? { 
                ...archivo, 
                estado: 'error' as const, 
                progreso: 0,
                error: resultado.error || 'Error al subir archivo'
              }
            : archivo
        ));

        notifications.show({
          title: 'Error al subir archivos',
          message: resultado.error || 'Ocurrió un error inesperado',
          color: 'red'
        });
      }
    } catch (error) {
      setArchivos(prev => prev.map(archivo => 
        files.some(f => f.name === archivo.file.name)
          ? { 
              ...archivo, 
              estado: 'error' as const, 
              progreso: 0,
              error: 'Error de conexión'
            }
          : archivo
      ));

      notifications.show({
        title: 'Error de conexión',
        message: 'No se pudo conectar con el servidor',
        color: 'red'
      });
    }
  };

  const handleRemove = (archivoId: string) => {
    setArchivos(prev => prev.filter(a => a.id !== archivoId));
    onRemove?.(archivoId);
  };

  const handlePreview = (archivo: ArchivoSubido) => {
    setPreviewFile(archivo);
    open();
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

  const renderArchivoCard = (archivo: ArchivoSubido) => {
    const fileConfig = getFileIcon(archivo.tipo);
    const IconComponent = fileConfig.icon;

    return (
      <Card key={archivo.id} padding="sm" withBorder>
        <Group justify="space-between" align="flex-start">
          <Group>
            <ThemeIcon size="lg" color={fileConfig.color} variant="light">
              <IconComponent size={20} />
            </ThemeIcon>
            
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={500} lineClamp={1}>
                {archivo.nombre}
              </Text>
              <Text size="xs" c="dimmed">
                {formatFileSize(archivo.tamaño)} • {fileConfig.label}
              </Text>
              
              {archivo.estado === 'subiendo' && (
                <Progress value={archivo.progreso} size="xs" mt={4} />
              )}
              
              {archivo.error && (
                <Text size="xs" c="red" mt={2}>
                  {archivo.error}
                </Text>
              )}
            </Box>
          </Group>
          
          <Group gap={4}>
            <Badge
              size="xs"
              color={
                archivo.estado === 'completado' ? 'green' :
                archivo.estado === 'error' ? 'red' :
                archivo.estado === 'subiendo' ? 'blue' : 'gray'
              }
              variant="light"
            >
              {archivo.estado === 'completado' ? 'Completado' :
               archivo.estado === 'error' ? 'Error' :
               archivo.estado === 'subiendo' ? 'Subiendo...' : 'Pendiente'}
            </Badge>
            
            {archivo.preview && (
              <Tooltip label="Vista previa">
                <ActionIcon size="sm" variant="light" onClick={() => handlePreview(archivo)}>
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
            )}
            
            {archivo.url && (
              <Tooltip label="Descargar">
                <ActionIcon size="sm" variant="light" color="blue" onClick={() => handleDownload(archivo)}>
                  <IconDownload size={14} />
                </ActionIcon>
              </Tooltip>
            )}
            
            <Tooltip label="Eliminar">
              <ActionIcon size="sm" variant="light" color="red" onClick={() => handleRemove(archivo.id)}>
                <IconX size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Card>
    );
  };

  const renderExistingFile = (file: { id: string; nombre: string; url: string; tipo: string; tamaño?: number }) => {
    const fileConfig = getFileIcon(file.tipo);
    const IconComponent = fileConfig.icon;

    return (
      <Card key={file.id} padding="sm" withBorder bg="gray.0">
        <Group justify="space-between">
          <Group>
            <ThemeIcon size="lg" color={fileConfig.color} variant="light">
              <IconComponent size={20} />
            </ThemeIcon>
            
            <Box>
              <Text size="sm" fw={500} lineClamp={1}>
                {file.nombre}
              </Text>
              <Text size="xs" c="dimmed">
                {file.tamaño ? formatFileSize(file.tamaño) : 'Tamaño desconocido'} • {fileConfig.label}
              </Text>
            </Box>
          </Group>
          
          <Group gap={4}>
            <Badge size="xs" color="green" variant="light">
              Guardado
            </Badge>
            
            <Tooltip label="Descargar">
              <ActionIcon 
                size="sm" 
                variant="light" 
                color="blue" 
                onClick={() => window.open(file.url, '_blank')}
              >
                <IconDownload size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Card>
    );
  };

  return (
    <Stack>
      {/* Zona de arrastrar y soltar */}
      <Dropzone
        onDrop={handleDrop}
        accept={accept}
        maxSize={maxSize * 1024 * 1024}
        multiple={multiple}
        disabled={disabled}
        activateOnClick={true}
        styles={{
          inner: {
            pointerEvents: 'all'
          }
        }}
      >
        <Group justify="center" gap="xl" mih={120} style={{ pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload
              size={52}
              color="var(--mantine-color-blue-6)"
            />
          </Dropzone.Accept>
          
          <Dropzone.Reject>
            <IconX
              size={52}
              color="var(--mantine-color-red-6)"
            />
          </Dropzone.Reject>
          
          <Dropzone.Idle>
            <IconCloudUpload size={52} stroke={1.5} />
          </Dropzone.Idle>

          <Box>
            <Text size="xl" inline>
              {label}
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              {description}
            </Text>
            
            <List size="xs" mt="sm" c="dimmed">
              <List.Item>Formatos: {accept.join(', ')}</List.Item>
              <List.Item>Tamaño máximo: {maxSize}MB por archivo</List.Item>
              {multiple && <List.Item>Múltiples archivos permitidos</List.Item>}
            </List>
          </Box>
        </Group>
      </Dropzone>

      {/* Archivos existentes */}
      {existingFiles.length > 0 && (
        <Box>
          <Text size="sm" fw={500} mb="xs">Archivos guardados:</Text>
          <Stack gap="xs">
            {existingFiles.map(renderExistingFile)}
          </Stack>
        </Box>
      )}

      {/* Lista de archivos en proceso/subidos */}
      {archivos.length > 0 && (
        <Box>
          <Text size="sm" fw={500} mb="xs">
            Archivos {archivos.some(a => a.estado === 'subiendo') ? 'subiendo' : 'procesados'}:
          </Text>
          <Stack gap="xs">
            {archivos.map(renderArchivoCard)}
          </Stack>
        </Box>
      )}

      {/* Modal de vista previa */}
      <Modal
        opened={opened}
        onClose={close}
        title={previewFile?.nombre}
        size="lg"
        centered
      >
        {previewFile?.preview && (
          <Box>
            <Image
              src={previewFile.preview}
              alt={previewFile.nombre}
              fit="contain"
              style={{ maxHeight: '70vh' }}
            />
          </Box>
        )}
      </Modal>
    </Stack>
  );
};

export default DocumentUpload;