import { Card, Stack, Text, Button } from '@mantine/core';
import { IconTruck, IconPlus } from '@tabler/icons-react';

interface EmptyStateProps {
  readonly?: boolean;
  loading?: boolean;
  onAddAssignment: () => void;
}

export function EmptyState({ readonly, loading, onAddAssignment }: EmptyStateProps) {
  return (
    <Card withBorder>
      <Stack align="center" gap="md" py="xl">
        <IconTruck size={48} color="gray" />
        <div style={{ textAlign: 'center' }}>
          <Text fw={500} mb="xs">
            No hay vehículos asignados
          </Text>
          <Text size="sm" c="dimmed" mb="md">
            Agregue al menos un vehículo para continuar con el viaje
          </Text>
          {!readonly && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={onAddAssignment}
              disabled={loading}
            >
              Agregar Primer Vehículo
            </Button>
          )}
        </div>
      </Stack>
    </Card>
  );
}
