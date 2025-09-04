import { useCallback } from 'react';
import { VehiculoAssignment } from '../components/viajes/VehiculoAssigner';
import { IconAlertCircle, IconClipboardList, IconCheck } from '@tabler/icons-react';

export function useAssignmentOperations() {
  const addAssignment = useCallback(
    (assignments: VehiculoAssignment[], onChange: (assignments: VehiculoAssignment[]) => void) => {
      const newAssignment: VehiculoAssignment = {
        id: Date.now().toString(),
        cantidadCamiones: 1,
      };

      onChange([...assignments, newAssignment]);
    },
    []
  );

  const removeAssignment = useCallback(
    (
      id: string,
      assignments: VehiculoAssignment[],
      onChange: (assignments: VehiculoAssignment[]) => void
    ) => {
      onChange(assignments.filter((a) => a.id !== id));
    },
    []
  );

  const updateAssignment = useCallback(
    (
      id: string,
      updates: Partial<VehiculoAssignment>,
      assignments: VehiculoAssignment[],
      onChange: (assignments: VehiculoAssignment[]) => void
    ) => {
      const updated = assignments.map((a) => (a.id === id ? { ...a, ...updates } : a));
      onChange(updated);
    },
    []
  );

  const getAssignmentStatus = useCallback(
    (assignment: VehiculoAssignment, errors: Record<string, string>) => {
      const hasErrors = Object.keys(errors).some((key) => key.startsWith(assignment.id));

      if (hasErrors) return { color: 'red', label: 'Incompleto', icon: IconAlertCircle };
      if (!assignment.vehiculo || !assignment.conductor)
        return { color: 'yellow', label: 'Pendiente', icon: IconClipboardList };
      return { color: 'green', label: 'Completo', icon: IconCheck };
    },
    []
  );

  const getTotalCamiones = useCallback((assignments: VehiculoAssignment[]) => {
    return assignments.reduce((total, a) => total + (a.cantidadCamiones || 0), 0);
  }, []);

  const getValidAssignments = useCallback(
    (assignments: VehiculoAssignment[], errors: Record<string, string>) => {
      return assignments.filter(
        (a) =>
          a.vehiculo &&
          a.conductor &&
          a.cantidadCamiones > 0 &&
          !Object.keys(errors).some((key) => key.startsWith(a.id))
      );
    },
    []
  );

  return {
    addAssignment,
    removeAssignment,
    updateAssignment,
    getAssignmentStatus,
    getTotalCamiones,
    getValidAssignments,
  };
}
