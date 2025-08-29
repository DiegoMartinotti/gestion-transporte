import { Container, Button, Group, Stack, Alert } from '@mantine/core';
import { IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';

interface ClienteDetailPageNotFoundProps {
  onNavigateBack: () => void;
}

export const ClienteDetailPageNotFound = ({ onNavigateBack }: ClienteDetailPageNotFoundProps) => {
  return (
    <Container size="md">
      <Stack gap="lg">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size="1rem" />}
            onClick={onNavigateBack}
          >
            Volver a Clientes
          </Button>
        </Group>

        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Cliente no encontrado"
          color="yellow"
          variant="light"
        >
          El cliente solicitado no existe o ha sido eliminado.
        </Alert>
      </Stack>
    </Container>
  );
};