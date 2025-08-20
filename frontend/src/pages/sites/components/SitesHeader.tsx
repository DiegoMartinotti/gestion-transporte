import React from 'react';
import { Group, Title, Button } from '@mantine/core';
import { IconPlus, IconDownload, IconUpload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface SitesHeaderProps {
  loading: boolean;
  onExport: () => void;
  onImport: () => void;
}

export const SitesHeader: React.FC<SitesHeaderProps> = ({ loading, onExport, onImport }) => (
  <Group justify="space-between">
    <Title order={2}>Gestión de Sites</Title>
    <Group gap="sm">
      <Button
        leftSection={<IconPlus size={16} />}
        onClick={() => {
          notifications.show({
            title: 'Funcionalidad pendiente',
            message: 'La creación de sites estará disponible pronto',
            color: 'blue',
          });
        }}
      >
        Nuevo Site
      </Button>
      <Button
        variant="light"
        leftSection={<IconDownload size={16} />}
        onClick={onExport}
        loading={loading}
      >
        Exportar
      </Button>
      <Button variant="light" leftSection={<IconUpload size={16} />} onClick={onImport}>
        Importar
      </Button>
    </Group>
  </Group>
);
