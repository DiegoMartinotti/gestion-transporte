import { Container, Button, Group, Stack, Alert } from '@mantine/core';
import { IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';

interface ViajeFormPageErrorProps {
  error: string;
  onCancel: () => void;
}

export const ViajeFormPageError = ({ error, onCancel }: ViajeFormPageErrorProps) => {
  return (
    <Container size="lg">
      <Stack gap="lg">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size="1rem" />}
            onClick={onCancel}
          >
            Volver
          </Button>
        </Group>

        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Error"
          color="red"
          variant="light"
        >
          {error}
        </Alert>
      </Stack>
    </Container>
  );
};