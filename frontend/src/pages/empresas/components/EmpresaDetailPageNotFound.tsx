import { Container, Button, Group, Stack, Alert } from '@mantine/core';
import { IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';

interface EmpresaDetailPageNotFoundProps {
  onNavigateBack: () => void;
}

export const EmpresaDetailPageNotFound = ({ onNavigateBack }: EmpresaDetailPageNotFoundProps) => {
  return (
    <Container size="md">
      <Stack gap="lg">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size="1rem" />}
            onClick={onNavigateBack}
          >
            Volver a Empresas
          </Button>
        </Group>

        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Empresa no encontrada"
          color="yellow"
          variant="light"
        >
          La empresa solicitada no existe o ha sido eliminada.
        </Alert>
      </Stack>
    </Container>
  );
};
