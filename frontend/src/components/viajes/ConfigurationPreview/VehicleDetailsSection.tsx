import { Group, Card, Text, ActionIcon, Divider, Table, ScrollArea, Collapse } from '@mantine/core';
import { IconTruck, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { VehiculoAssignment } from '../VehiculoAssigner';
import { VehicleDetectionResult } from '../VehicleTypeDetector';
import { VehicleTableRow } from './VehicleTableRow';

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
              {assignments.map((assignment) => (
                <VehicleTableRow
                  key={assignment.id}
                  assignment={assignment}
                  detection={detectionResults[assignment.id]}
                  riesgos={riesgos}
                />
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Collapse>
    </Card>
  );
}
