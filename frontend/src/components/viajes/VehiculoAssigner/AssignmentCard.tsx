import { Stack, Group, Card, Text, Badge, ActionIcon, Divider, Tooltip } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { VehiculoAssignment } from '../VehiculoAssigner';
import { AssignmentForm } from './AssignmentForm';
import { VehicleInfo } from './VehicleInfo';
import type { Personal, Vehiculo } from '../../../types';

interface AssignmentCardProps {
  assignment: VehiculoAssignment;
  index: number;
  status: {
    color: string;
    label: string;
    icon: any;
  };
  vehiculos: Vehiculo[];
  conductores: Personal[];
  acompanantes: Personal[];
  errors: Record<string, string>;
  readonly?: boolean;
  loading?: boolean;
  onUpdate: (id: string, updates: Partial<VehiculoAssignment>) => void;
  onRemove: (id: string) => void;
}

export function AssignmentCard({
  assignment,
  index,
  status,
  vehiculos,
  conductores,
  acompanantes,
  errors,
  readonly,
  loading,
  onUpdate,
  onRemove,
}: AssignmentCardProps) {
  const StatusIcon = status.icon;

  return (
    <Card key={assignment.id} withBorder>
      <Stack gap="md">
        {/* Header de la asignación */}
        <Group justify="space-between">
          <Group>
            <StatusIcon size={16} color={status.color} />
            <Text fw={500}>Configuración #{index + 1}</Text>
            <Badge color={status.color} variant="light" size="sm">
              {status.label}
            </Badge>
          </Group>

          {!readonly && (
            <Tooltip label="Eliminar configuración">
              <ActionIcon color="red" variant="light" onClick={() => onRemove(assignment.id)}>
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>

        <Divider />

        <AssignmentForm
          assignment={assignment}
          vehiculos={vehiculos}
          conductores={conductores}
          acompanantes={acompanantes}
          errors={errors}
          readonly={readonly}
          loading={loading}
          onUpdate={onUpdate}
        />

        <VehicleInfo vehiculo={assignment.vehiculo} />
      </Stack>
    </Card>
  );
}
