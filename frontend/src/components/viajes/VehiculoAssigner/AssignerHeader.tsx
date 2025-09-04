import { Group, Card, Text, Badge, Button } from '@mantine/core';
import { IconTruck, IconPlus } from '@tabler/icons-react';
import { VehiculoAssignment } from '../VehiculoAssigner';

interface AssignerHeaderProps {
  assignments: VehiculoAssignment[];
  validAssignmentsCount: number;
  totalCamiones: number;
  readonly?: boolean;
  loading?: boolean;
  onAddAssignment: () => void;
}

export function AssignerHeader({
  assignments,
  validAssignmentsCount,
  totalCamiones,
  readonly,
  loading,
  onAddAssignment,
}: AssignerHeaderProps) {
  return (
    <Card withBorder>
      <Group justify="space-between">
        <Group>
          <IconTruck size={20} />
          <div>
            <Text fw={500}>Configuración de Vehículos</Text>
            <Text size="sm" c="dimmed">
              {assignments.length} asignación(es) • {totalCamiones} camión(es) total
            </Text>
          </div>
        </Group>

        <Group>
          <Badge
            color={validAssignmentsCount === assignments.length ? 'green' : 'yellow'}
            variant="light"
          >
            {validAssignmentsCount}/{assignments.length} válidas
          </Badge>

          {!readonly && (
            <Button
              leftSection={<IconPlus size={16} />}
              variant="light"
              onClick={onAddAssignment}
              disabled={loading}
            >
              Agregar Vehículo
            </Button>
          )}
        </Group>
      </Group>
    </Card>
  );
}
