import React from 'react';
import { Paper, Group, ThemeIcon, Box, Text, ActionIcon, Button } from '@mantine/core';
import {
  IconFileSpreadsheet,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconX,
} from '@tabler/icons-react';

interface ImportHeaderProps {
  fileName: string;
  entityType: string;
  isRunning: boolean;
  isCompleted: boolean;
  hasErrors: boolean;
  canPause: boolean;
  canCancel: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
}

const HeaderInfo: React.FC<{ fileName: string; entityType: string }> = ({
  fileName,
  entityType,
}) => (
  <Group gap="sm">
    <ThemeIcon size="lg" variant="light" color="blue">
      <IconFileSpreadsheet size={20} />
    </ThemeIcon>
    <Box>
      <Text fw={500} size="sm">
        Importación de {entityType}
      </Text>
      <Text size="xs" c="dimmed">
        {fileName}
      </Text>
    </Box>
  </Group>
);

interface ActionConfig {
  show: boolean;
  component: React.ReactNode;
}

const ActionButtons: React.FC<{
  isRunning: boolean;
  isCompleted: boolean;
  hasErrors: boolean;
  canPause: boolean;
  canCancel: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
}> = (props) => {
  const {
    isRunning,
    isCompleted,
    hasErrors,
    canPause,
    canCancel,
    onPause,
    onResume,
    onCancel,
    onRetry,
  } = props;

  const actions: ActionConfig[] = [
    {
      show: isRunning && canPause && !!onPause,
      component: (
        <ActionIcon key="pause" variant="light" color="orange" onClick={onPause}>
          <IconPlayerPause size={16} />
        </ActionIcon>
      ),
    },
    {
      show: !isRunning && !isCompleted && !hasErrors && !!onResume,
      component: (
        <ActionIcon key="resume" variant="light" color="green" onClick={onResume}>
          <IconPlayerPlay size={16} />
        </ActionIcon>
      ),
    },
    {
      show: hasErrors && !!onRetry,
      component: (
        <Button
          key="retry"
          leftSection={<IconRefresh size={16} />}
          variant="light"
          color="blue"
          size="sm"
          onClick={onRetry}
        >
          Reintentar
        </Button>
      ),
    },
    {
      show: canCancel && !isCompleted && !!onCancel,
      component: (
        <Button
          key="cancel"
          leftSection={<IconX size={16} />}
          variant="light"
          color="red"
          size="sm"
          onClick={onCancel}
        >
          Cancelar
        </Button>
      ),
    },
  ];

  return (
    <Group gap="sm">
      {actions.filter((action) => action.show).map((action) => action.component)}
    </Group>
  );
};

export const ImportHeader: React.FC<ImportHeaderProps> = (props) => {
  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" align="center">
        <HeaderInfo fileName={props.fileName} entityType={props.entityType} />
        <ActionButtons {...props} />
      </Group>
    </Paper>
  );
};
