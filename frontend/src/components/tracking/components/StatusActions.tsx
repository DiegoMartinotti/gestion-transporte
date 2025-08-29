import React from 'react';
import { Card, Group, Text, Button } from '@mantine/core';
import { IconFlag, IconPlus } from '@tabler/icons-react';
import { StatusConfig } from '../StatusTrackerBase';

interface StatusActionsProps {
  allowedNextStates: StatusConfig['estados'];
  onOpenStatusModal: () => void;
  onOpenEventModal: () => void;
  customActions?: React.ReactNode;
}

export const StatusActions: React.FC<StatusActionsProps> = ({
  allowedNextStates,
  onOpenStatusModal,
  onOpenEventModal,
  customActions,
}) => {
  return (
    <Card withBorder p="sm">
      <Group justify="space-between" mb="md">
        <Text fw={500}>Acciones</Text>
      </Group>

      <Group>
        <Button
          size="sm"
          variant="light"
          leftSection={<IconFlag size={16} />}
          onClick={onOpenStatusModal}
          disabled={allowedNextStates.length === 0}
        >
          Cambiar Estado
        </Button>

        <Button
          size="sm"
          variant="light"
          leftSection={<IconPlus size={16} />}
          onClick={onOpenEventModal}
        >
          Agregar Evento
        </Button>

        {customActions}
      </Group>
    </Card>
  );
};
