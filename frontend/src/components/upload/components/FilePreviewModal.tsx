import React from 'react';
import { Modal, Box, Image } from '@mantine/core';
import { ArchivoSubido } from '../utils/fileUtils';

interface FilePreviewModalProps {
  opened: boolean;
  onClose: () => void;
  previewFile: ArchivoSubido | null;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  opened,
  onClose,
  previewFile,
}) => {
  return (
    <Modal opened={opened} onClose={onClose} title={previewFile?.nombre} size="lg" centered>
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
  );
};
