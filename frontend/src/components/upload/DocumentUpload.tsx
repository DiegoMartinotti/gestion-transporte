import React, { useState } from 'react';
import { Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useFileUpload } from './hooks/useFileUpload';
import { DropzoneArea } from './components/DropzoneArea';
import { ExistingFilesList } from './components/ExistingFilesList';
import { ProcessedFilesList } from './components/ProcessedFilesList';
import { FilePreviewModal } from './components/FilePreviewModal';
import { ArchivoSubido } from './utils/fileUtils';

interface DocumentUploadProps {
  multiple?: boolean;
  accept?: string[];
  maxSize?: number;
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

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  multiple = false,
  accept = ['application/pdf', 'image/*'],
  maxSize = 10,
  onUpload,
  onPreview,
  onRemove,
  disabled = false,
  label = 'Subir documentos',
  description = 'Arrastra archivos aquí o haz clic para seleccionar',
  existingFiles = [],
}) => {
  const [previewFile, setPreviewFile] = useState<ArchivoSubido | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const {
    archivos,
    handleDrop,
    handleRemove,
    handlePreview: hookHandlePreview,
    handleDownload,
  } = useFileUpload({
    accept,
    maxSize,
    onUpload,
    onRemove,
    onPreview,
  });

  const handlePreview = (archivo: ArchivoSubido) => {
    setPreviewFile(archivo);
    open();
    hookHandlePreview(archivo);
  };

  return (
    <Stack>
      <DropzoneArea
        onDrop={handleDrop}
        accept={accept}
        maxSize={maxSize}
        multiple={multiple}
        disabled={disabled}
        label={label}
        description={description}
      />

      <ExistingFilesList files={existingFiles} />

      <ProcessedFilesList
        archivos={archivos}
        onRemove={handleRemove}
        onPreview={handlePreview}
        onDownload={handleDownload}
      />

      <FilePreviewModal opened={opened} onClose={close} previewFile={previewFile} />
    </Stack>
  );
};

export default DocumentUpload;
