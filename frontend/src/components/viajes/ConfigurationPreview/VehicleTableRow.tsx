import { Table, Text, Badge, Group, NumberFormatter, Tooltip } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { VehiculoAssignment } from '../VehiculoAssigner';
import { VehicleDetectionResult } from '../VehicleTypeDetector';

interface VehicleTableRowProps {
  assignment: VehiculoAssignment;
  detection?: VehicleDetectionResult;
  riesgos: Array<{
    tipo: 'warning' | 'error' | 'info';
    mensaje: string;
    vehiculoId?: string;
  }>;
}

const getConfidenceBadgeColor = (confidence: number) => {
  if (confidence >= 80) return 'green';
  if (confidence >= 60) return 'yellow';
  return 'red';
};

const getRiesgosForAssignment = (
  assignmentId: string,
  riesgos: VehicleTableRowProps['riesgos']
) => {
  const hasErrors = riesgos.some((r) => r.vehiculoId === assignmentId && r.tipo === 'error');
  const hasWarnings = riesgos.some((r) => r.vehiculoId === assignmentId && r.tipo === 'warning');
  return { hasErrors, hasWarnings };
};

const VehicleInfo = ({ vehiculo }: { vehiculo: VehiculoAssignment['vehiculo'] }) => {
  if (!vehiculo) {
    return (
      <Text c="dimmed" size="sm">
        No seleccionado
      </Text>
    );
  }
  return (
    <div>
      <Text fw={500} size="sm">
        {vehiculo.patente}
      </Text>
      <Text size="xs" c="dimmed">
        {vehiculo.marca} {vehiculo.modelo}
      </Text>
    </div>
  );
};

const ConductorInfo = ({ conductor }: { conductor: VehiculoAssignment['conductor'] }) => {
  if (!conductor) {
    return (
      <Text c="dimmed" size="sm">
        No asignado
      </Text>
    );
  }
  return (
    <div>
      <Text fw={500} size="sm">
        {conductor.nombre} {conductor.apellido}
      </Text>
      <Text size="xs" c="dimmed">
        {conductor.documentacion?.licenciaConducir?.numero || 'N/A'}
      </Text>
    </div>
  );
};

const DetectionInfo = ({ detection }: { detection?: VehicleDetectionResult }) => {
  if (!detection) {
    return (
      <Text c="dimmed" size="sm">
        No detectado
      </Text>
    );
  }
  return (
    <Tooltip label={`Confianza: ${detection.confidence.toFixed(0)}%`}>
      <Badge color={getConfidenceBadgeColor(detection.confidence)} variant="light" size="sm">
        {detection.tipoUnidad.replace('_', ' ')}
      </Badge>
    </Tooltip>
  );
};

const StatusBadges = ({ hasErrors, hasWarnings }: { hasErrors: boolean; hasWarnings: boolean }) => (
  <Group gap="xs">
    {hasErrors && (
      <Badge color="red" variant="light" size="sm">
        Error
      </Badge>
    )}
    {hasWarnings && !hasErrors && (
      <Badge color="yellow" variant="light" size="sm">
        Alerta
      </Badge>
    )}
    {!hasErrors && !hasWarnings && (
      <Badge color="green" variant="light" size="sm">
        <IconCheck size={12} />
      </Badge>
    )}
  </Group>
);

export function VehicleTableRow({ assignment, detection, riesgos }: VehicleTableRowProps) {
  const vehiculo = assignment.vehiculo;
  const conductor = assignment.conductor;
  const capacidadTotal = vehiculo ? 10000 * (assignment.cantidadCamiones || 0) : 0;
  const { hasErrors, hasWarnings } = getRiesgosForAssignment(assignment.id, riesgos);

  return (
    <Table.Tr key={assignment.id}>
      <Table.Td>
        <VehicleInfo vehiculo={vehiculo} />
      </Table.Td>
      <Table.Td>
        <ConductorInfo conductor={conductor} />
      </Table.Td>
      <Table.Td>
        <Text fw={500}>{assignment.cantidadCamiones || 0}</Text>
      </Table.Td>
      <Table.Td>
        <Text fw={500}>
          <NumberFormatter value={capacidadTotal} thousandSeparator /> kg
        </Text>
      </Table.Td>
      <Table.Td>
        <DetectionInfo detection={detection} />
      </Table.Td>
      <Table.Td>
        <StatusBadges hasErrors={hasErrors} hasWarnings={hasWarnings} />
      </Table.Td>
    </Table.Tr>
  );
}
