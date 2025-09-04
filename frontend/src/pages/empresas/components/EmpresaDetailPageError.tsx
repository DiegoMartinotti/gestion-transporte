import { Container, Button, Group, Stack, Alert } from '@mantine/core';
import { IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';

interface EmpresaDetailPageErrorProps {
  error: string;
  onNavigateBack: () => void;
}

export const EmpresaDetailPageError = ({ error, onNavigateBack }: EmpresaDetailPageErrorProps) => {
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

        <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red" variant="light">
          {error}
        </Alert>
      </Stack>
    </Container>
  );
};
