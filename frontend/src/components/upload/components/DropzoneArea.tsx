import React from 'react';
import { Box, Group, Text, List } from '@mantine/core';
import { IconUpload, IconX, IconCloudUpload } from '@tabler/icons-react';
import { Dropzone } from '@mantine/dropzone';

interface DropzoneAreaProps {
  onDrop: (files: File[]) => void;
  accept: string[];
  maxSize: number;
  multiple: boolean;
  disabled: boolean;
  label: string;
  description: string;
}

export const DropzoneArea: React.FC<DropzoneAreaProps> = ({
  onDrop,
  accept,
  maxSize,
  multiple,
  disabled,
  label,
  description,
}) => {
  return (
    <Dropzone
      onDrop={onDrop}
      accept={accept}
      maxSize={maxSize * 1024 * 1024}
      multiple={multiple}
      disabled={disabled}
      activateOnClick={true}
      styles={{
        inner: {
          pointerEvents: 'all',
        },
      }}
    >
      <Group justify="center" gap="xl" mih={120} style={{ pointerEvents: 'none' }}>
        <Dropzone.Accept>
          <IconUpload size={52} color="var(--mantine-color-blue-6)" />
        </Dropzone.Accept>

        <Dropzone.Reject>
          <IconX size={52} color="var(--mantine-color-red-6)" />
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
  );
};
