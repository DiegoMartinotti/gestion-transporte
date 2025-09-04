import { Group, NumberInput } from '@mantine/core';
import { VehiculoSelector } from '../../selectors/VehiculoSelector';
import { PersonalSelector } from '../../selectors/PersonalSelector';
import { VehiculoAssignment } from '../VehiculoAssigner';
import type { Personal, Vehiculo } from '../../../types';

interface AssignmentFormProps {
  assignment: VehiculoAssignment;
  vehiculos: Vehiculo[];
  conductores: Personal[];
  acompanantes: Personal[];
  errors: Record<string, string>;
  readonly?: boolean;
  loading?: boolean;
  onUpdate: (id: string, updates: Partial<VehiculoAssignment>) => void;
}

export function AssignmentForm({
  assignment,
  vehiculos,
  conductores,
  acompanantes,
  errors,
  readonly,
  loading,
  onUpdate,
}: AssignmentFormProps) {
  return (
    <>
      <Group grow>
        {/* Selección de vehículo */}
        <VehiculoSelector
          value={assignment.vehiculo?._id}
          onChange={(vehiculoId) => {
            const vehiculo = vehiculos.find((v) => v._id === vehiculoId);
            onUpdate(assignment.id, { vehiculo });
          }}
          placeholder="Seleccionar vehículo"
          error={errors[`${assignment.id}.vehiculo`]}
          disabled={readonly || loading}
        />

        {/* Cantidad de camiones */}
        <NumberInput
          label="Cantidad de Camiones"
          value={assignment.cantidadCamiones}
          onChange={(value) => onUpdate(assignment.id, { cantidadCamiones: Number(value) || 1 })}
          min={1}
          max={10}
          error={errors[`${assignment.id}.cantidadCamiones`]}
          disabled={readonly}
        />
      </Group>

      <Group grow>
        {/* Selección de conductor */}
        <PersonalSelector
          value={assignment.conductor?._id}
          onChange={(conductorId) => {
            const conductor = conductores.find((c) => c._id === conductorId);
            onUpdate(assignment.id, { conductor });
          }}
          tipo="Conductor"
          placeholder="Seleccionar conductor"
          error={errors[`${assignment.id}.conductor`]}
          disabled={readonly || loading}
        />

        {/* Selección de acompañante (opcional) */}
        <PersonalSelector
          value={assignment.acompanante?._id}
          onChange={(acompananteId) => {
            const acompanante = acompanantes.find((a) => a._id === acompananteId);
            onUpdate(assignment.id, { acompanante });
          }}
          tipo="Otro"
          placeholder="Acompañante (opcional)"
          disabled={readonly || loading}
        />
      </Group>
    </>
  );
}
