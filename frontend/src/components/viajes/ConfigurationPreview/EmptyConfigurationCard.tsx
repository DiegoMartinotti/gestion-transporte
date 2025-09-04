import { Card, Stack, Text } from '@mantine/core';
import { IconTruck } from '@tabler/icons-react';

export function EmptyConfigurationCard() {
  return (
    <Card withBorder>
      <Stack align="center" gap="md" py="xl">
        <IconTruck size={48} color="gray" />
        <div style={{ textAlign: 'center' }}>
          <Text fw={500} mb="xs">
            No hay configuración para mostrar
          </Text>
          <Text size="sm" c="dimmed">
            Configure al menos un vehículo para ver la vista previa
          </Text>
        </div>
      </Stack>
    </Card>
  );
}
