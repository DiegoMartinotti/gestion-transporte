import {
  Group,
  Card,
  Text,
  Badge,
  ActionIcon,
  Divider,
  Table,
  ScrollArea,
  Collapse,
  NumberFormatter,
  Tooltip,
} from '@mantine/core';
import { IconTruck, IconChevronDown, IconChevronUp, IconCheck } from '@tabler/icons-react';
import { VehiculoAssignment } from '../VehiculoAssigner';
import { VehicleDetectionResult } from '../VehicleTypeDetector';

interface VehicleDetailsSectionProps {
  assignments: VehiculoAssignment[];
  detectionResults: Record<string, VehicleDetectionResult>;
  riesgos: Array<{
    tipo: 'warning' | 'error' | 'info';
    mensaje: string;
    vehiculoId?: string;
  }>;
  expanded: boolean;
  onToggle: () => void;
}

export function VehicleDetailsSection({
  assignments,
  detectionResults,
  riesgos,
  expanded,
  onToggle,
}: VehicleDetailsSectionProps) {
  return (
    <Card withBorder>
      <Group justify="space-between" onClick={onToggle} style={{ cursor: 'pointer' }}>
        <Group>
          <IconTruck size={20} />
          <div>
            <Text fw={500}>Detalle de Vehículos</Text>
            <Text size="sm" c="dimmed">
              Configuración por vehículo
            </Text>
          </div>
        </Group>
        <ActionIcon variant="transparent">
          {expanded ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
        </ActionIcon>
      </Group>

      <Collapse in={expanded}>
        <Divider my="md" />
        <ScrollArea>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Vehículo</Table.Th>
                <Table.Th>Conductor</Table.Th>
                <Table.Th>Camiones</Table.Th>
                <Table.Th>Capacidad</Table.Th>
                <Table.Th>Tipo Detectado</Table.Th>
                <Table.Th>Estado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {assignments.map((assignment) => {
                const detection = detectionResults[assignment.id];
                const vehiculo = assignment.vehiculo;
                const conductor = assignment.conductor;
                const capacidadTotal = vehiculo ? 10000 * (assignment.cantidadCamiones || 0) : 0;

                const hasErrors = riesgos.some(
                  (r) => r.vehiculoId === assignment.id && r.tipo === 'error'
                );

                const hasWarnings = riesgos.some(
                  (r) => r.vehiculoId === assignment.id && r.tipo === 'warning'
                );

                return (
                  <Table.Tr key={assignment.id}>
                    <Table.Td>
                      {vehiculo ? (
                        <div>
                          <Text fw={500} size="sm">
                            {vehiculo.patente}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {vehiculo.marca} {vehiculo.modelo}
                          </Text>
                        </div>
                      ) : (
                        <Text c="dimmed" size="sm">
                          No seleccionado
                        </Text>
                      )}
                    </Table.Td>

                    <Table.Td>
                      {conductor ? (
                        <div>
                          <Text fw={500} size="sm">
                            {conductor.nombre} {conductor.apellido}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {conductor.documentacion?.licenciaConducir?.numero || 'N/A'}
                          </Text>
                        </div>
                      ) : (
                        <Text c="dimmed" size="sm">
                          No asignado
                        </Text>
                      )}
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
                      {detection ? (
                        <Tooltip label={`Confianza: ${detection.confidence.toFixed(0)}%`}>
                          <Badge
                            color={
                              detection.confidence >= 80
                                ? 'green'
                                : detection.confidence >= 60
                                  ? 'yellow'
                                  : 'red'
                            }
                            variant="light"
                            size="sm"
                          >
                            {detection.tipoUnidad.replace('_', ' ')}
                          </Badge>
                        </Tooltip>
                      ) : (
                        <Text c="dimmed" size="sm">
                          No detectado
                        </Text>
                      )}
                    </Table.Td>

                    <Table.Td>
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
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Collapse>
    </Card>
  );
}
