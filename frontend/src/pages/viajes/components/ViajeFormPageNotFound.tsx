import { Container, Button, Group, Stack, Alert } from '@mantine/core';
import { IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';

interface ViajeFormPageNotFoundProps {
  onNavigateToList: () => void;
}

export const ViajeFormPageNotFound = ({ onNavigateToList }: ViajeFormPageNotFoundProps) => {
  return (
    <Container size="lg">
      <Stack gap="lg">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size="1rem" />}
            onClick={onNavigateToList}
          >
            Volver a Viajes
          </Button>
        </Group>

        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Viaje no encontrado"
          color="yellow"
          variant="light"
        >
          El viaje solicitado no existe o ha sido eliminado.
        </Alert>
      </Stack>
    </Container>
  );
};