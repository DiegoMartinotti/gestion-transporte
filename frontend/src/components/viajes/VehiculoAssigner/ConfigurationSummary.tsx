import { Group, Card, Text, Badge } from '@mantine/core';
import { VehiculoAssignment } from '../VehiculoAssigner';

interface ConfigurationSummaryProps {
  assignments: VehiculoAssignment[];
  validAssignmentsCount: number;
  totalCamiones: number;
}

export function ConfigurationSummary({
  assignments,
  validAssignmentsCount,
  totalCamiones,
}: ConfigurationSummaryProps) {
  if (assignments.length === 0) return null;

  return (
    <Card withBorder bg="blue.0">
      <Group justify="space-between">
        <div>
          <Text fw={500}>Resumen de Configuración</Text>
          <Text size="sm" c="dimmed">
            Total: {totalCamiones} camión(es) en {assignments.length} configuración(es)
          </Text>
        </div>
        <Group>
          <Badge color="blue" variant="light">
            {validAssignmentsCount} completas
          </Badge>
          {assignments.length - validAssignmentsCount > 0 && (
            <Badge color="yellow" variant="light">
              {assignments.length - validAssignmentsCount} pendientes
            </Badge>
          )}
        </Group>
      </Group>
    </Card>
  );
}
