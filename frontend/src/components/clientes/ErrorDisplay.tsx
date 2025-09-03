import { Container, Button, Group, Stack, Alert } from '@mantine/core';
import { IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';

interface ErrorDisplayProps {
  error: string;
  onBack: () => void;
  type?: 'error' | 'notFound';
}

export function ErrorDisplay({ error, onBack, type = 'error' }: ErrorDisplayProps) {
  const isNotFound = type === 'notFound';

  return (
    <Container size="md">
      <Stack gap="lg">
        <Group>
          <Button variant="subtle" leftSection={<IconArrowLeft size="1rem" />} onClick={onBack}>
            {isNotFound ? 'Volver a Clientes' : 'Volver'}
          </Button>
        </Group>

        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title={isNotFound ? 'Cliente no encontrado' : 'Error'}
          color={isNotFound ? 'yellow' : 'red'}
          variant="light"
        >
          {error}
        </Alert>
      </Stack>
    </Container>
  );
}
