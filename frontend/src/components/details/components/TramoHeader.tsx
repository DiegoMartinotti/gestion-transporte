import React from 'react';
import { Group, Button, Title } from '@mantine/core';
import { IconRoute, IconCalculator, IconMap, IconEdit } from '@tabler/icons-react';

interface TramoHeaderProps {
  onOpenCalculator: () => void;
  onEdit: () => void;
}

const TramoHeader: React.FC<TramoHeaderProps> = ({ onOpenCalculator, onEdit }) => {
  return (
    <Group justify="space-between" mb="md">
      <Group>
        <IconRoute size={24} />
        <Title order={3}>Detalle del Tramo</Title>
      </Group>
      <Group>
        <Button
          variant="light"
          leftSection={<IconCalculator size={16} />}
          onClick={onOpenCalculator}
        >
          Calcular Costo
        </Button>
        <Button
          variant="light"
          leftSection={<IconMap size={16} />}
          onClick={() => {
            /* TODO: Abrir en mapa */
          }}
        >
          Ver en Mapa
        </Button>
        <Button leftSection={<IconEdit size={16} />} onClick={onEdit}>
          Editar
        </Button>
      </Group>
    </Group>
  );
};

export default TramoHeader;
