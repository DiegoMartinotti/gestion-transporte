import React from 'react';
import { Group, Text, Badge, Button, Menu, ActionIcon } from '@mantine/core';
import {
  IconRoute,
  IconDownload,
  IconDots,
  IconUpload,
  IconRefresh,
  IconPlus,
} from '@tabler/icons-react';
import { ModalReturn } from '../../../hooks/useModal';

interface TramosStats {
  total: number;
  conTarifa: number;
  sinTarifa: number;
}

interface TramosHeaderProps {
  stats: TramosStats;
  importModal: ModalReturn;
  onExport: () => void;
  onGetTemplate: () => void;
  onRefresh: () => void;
  onNewTramo: () => void;
}

export const TramosHeader: React.FC<TramosHeaderProps> = ({
  stats,
  importModal,
  onExport,
  onGetTemplate,
  onRefresh,
  onNewTramo,
}) => (
  <Group justify="space-between" mb="md">
    <Group>
      <IconRoute size={24} />
      <Text size="lg" fw={600}>
        Gestión de Tramos
      </Text>
      <Badge color="blue" size="sm">
        {stats.total}
      </Badge>
    </Group>

    <Group>
      <Button leftSection={<IconDownload size={16} />} onClick={onExport} variant="light" size="sm">
        Exportar
      </Button>

      <Menu shadow="md">
        <Menu.Target>
          <ActionIcon variant="light" size="lg">
            <IconDots size={16} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item leftSection={<IconUpload size={14} />} onClick={importModal.open}>
            Importar Excel
          </Menu.Item>
          <Menu.Item leftSection={<IconDownload size={14} />} onClick={onGetTemplate}>
            Descargar Plantilla
          </Menu.Item>
          <Menu.Item leftSection={<IconRefresh size={14} />} onClick={onRefresh}>
            Actualizar
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Button leftSection={<IconPlus size={16} />} onClick={onNewTramo}>
        Nuevo Tramo
      </Button>
    </Group>
  </Group>
);
