import React from 'react';
import { Stack, ScrollArea } from '@mantine/core';
import { useVehiculoAssignerData } from '../../hooks/useVehiculoAssignerData';
import { useAssignmentValidation } from '../../hooks/useAssignmentValidation';
import { useAssignmentOperations } from '../../hooks/useAssignmentOperations';
import { AssignerHeader } from './VehiculoAssigner/AssignerHeader';
import { AssignmentCard } from './VehiculoAssigner/AssignmentCard';
import { EmptyState } from './VehiculoAssigner/EmptyState';
import { ValidationAlert } from './VehiculoAssigner/ValidationAlert';
import { ConfigurationSummary } from './VehiculoAssigner/ConfigurationSummary';
import type { Personal, Vehiculo } from '../../types';

export interface VehiculoAssignment {
  id: string;
  vehiculo?: Vehiculo;
  conductor?: Personal;
  acompanante?: Personal;
  cantidadCamiones: number;
  observaciones?: string;
}

interface VehiculoAssignerProps {
  assignments: VehiculoAssignment[];
  onChange: (assignments: VehiculoAssignment[]) => void;
  clienteId?: string;
  empresaId?: string;
  readonly?: boolean;
}

export function VehiculoAssigner({
  assignments,
  onChange,
  clienteId: _clienteId,
  empresaId,
  readonly = false,
}: VehiculoAssignerProps) {
  const { vehiculos, conductores, acompanantes, loading } = useVehiculoAssignerData(empresaId);
  const { errors, validateAssignment } = useAssignmentValidation();
  const {
    addAssignment,
    removeAssignment,
    updateAssignment,
    getAssignmentStatus,
    getTotalCamiones,
    getValidAssignments,
  } = useAssignmentOperations();

  const handleAddAssignment = () => {
    addAssignment(assignments, onChange);
  };

  const handleRemoveAssignment = (id: string) => {
    removeAssignment(id, assignments, onChange);
  };

  const handleUpdateAssignment = (id: string, updates: Partial<VehiculoAssignment>) => {
    updateAssignment(id, updates, assignments, onChange);

    // Validar assignment actualizado
    const currentAssignment = assignments.find((a) => a.id === id);
    if (currentAssignment) {
      validateAssignment(id, { ...currentAssignment, ...updates }, assignments);
    }
  };

  const totalCamiones = getTotalCamiones(assignments);
  const validAssignments = getValidAssignments(assignments, errors);

  if (assignments.length === 0) {
    return (
      <Stack gap="md">
        <AssignerHeader
          assignments={assignments}
          validAssignmentsCount={validAssignments.length}
          totalCamiones={totalCamiones}
          readonly={readonly}
          loading={loading}
          onAddAssignment={handleAddAssignment}
        />
        <EmptyState readonly={readonly} loading={loading} onAddAssignment={handleAddAssignment} />
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <AssignerHeader
        assignments={assignments}
        validAssignmentsCount={validAssignments.length}
        totalCamiones={totalCamiones}
        readonly={readonly}
        loading={loading}
        onAddAssignment={handleAddAssignment}
      />

      <ScrollArea h={400}>
        <Stack gap="sm">
          {assignments.map((assignment, index) => {
            const status = getAssignmentStatus(assignment, errors);

            return (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                index={index}
                status={status}
                vehiculos={vehiculos}
                conductores={conductores}
                acompanantes={acompanantes}
                errors={errors}
                readonly={readonly}
                loading={loading}
                onUpdate={handleUpdateAssignment}
                onRemove={handleRemoveAssignment}
              />
            );
          })}
        </Stack>
      </ScrollArea>

      <ValidationAlert hasErrors={Object.keys(errors).length > 0} />

      <ConfigurationSummary
        assignments={assignments}
        validAssignmentsCount={validAssignments.length}
        totalCamiones={totalCamiones}
      />
    </Stack>
  );
}
