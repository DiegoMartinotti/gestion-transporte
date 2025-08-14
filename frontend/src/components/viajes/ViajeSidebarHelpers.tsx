import { Stack, Card, Text, Button, Group, ActionIcon, RingProgress, Center } from '@mantine/core';
import { IconFileText, IconDownload } from '@tabler/icons-react';

export const renderProgressCard = (progressValue: number, badgeColor: string) => (
  <Card>
    <Stack ta="center">
      <RingProgress
        size={120}
        thickness={12}
        sections={[{ value: progressValue, color: badgeColor }]}
        label={
          <Center>
            <Text size="xs" fw={700}>
              {progressValue}%
            </Text>
          </Center>
        }
      />
      <Text size="sm" c="dimmed" ta="center">
        Progreso del viaje
      </Text>
    </Stack>
  </Card>
);

export const renderActionButtons = (estado: string, onChangeEstado: (estado: string) => void) => {
  const buttons = [];

  if (estado === 'Pendiente') {
    buttons.push(
      <Button
        key="iniciar"
        fullWidth
        variant="light"
        color="blue"
        onClick={() => onChangeEstado('En Progreso')}
      >
        Iniciar Viaje
      </Button>
    );
  }

  if (estado === 'En Progreso') {
    buttons.push(
      <Button
        key="completar"
        fullWidth
        variant="light"
        color="green"
        onClick={() => onChangeEstado('Completado')}
      >
        Completar Viaje
      </Button>
    );
  }

  if (estado === 'Completado') {
    buttons.push(
      <Button
        key="facturar"
        fullWidth
        variant="light"
        color="violet"
        onClick={() => onChangeEstado('Facturado')}
      >
        Marcar Facturado
      </Button>
    );
  }

  if (estado !== 'Facturado' && estado !== 'Cancelado') {
    buttons.push(
      <Button
        key="cancelar"
        fullWidth
        variant="light"
        color="red"
        onClick={() => onChangeEstado('Cancelado')}
      >
        Cancelar Viaje
      </Button>
    );
  }

  return <Stack gap="xs">{buttons}</Stack>;
};

export const renderDocumentsCard = (documentos: unknown[], onShowDocuments: () => void) => (
  <Card>
    <Group justify="space-between" mb="md">
      <Text size="sm" fw={600}>
        DOCUMENTOS
      </Text>
      <Button variant="light" size="xs" onClick={onShowDocuments}>
        Ver todos
      </Button>
    </Group>
    <Stack gap="xs">
      {documentos.slice(0, 3).map((doc, index) => (
        <Group key={index} justify="space-between">
          <Group gap="xs">
            <IconFileText size={14} />
            <Text size="sm">{doc.nombre}</Text>
          </Group>
          <ActionIcon variant="light" size="sm">
            <IconDownload size={12} />
          </ActionIcon>
        </Group>
      ))}
    </Stack>
  </Card>
);
