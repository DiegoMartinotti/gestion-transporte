import { useState, useCallback } from 'react';
import { VehiculoAssignment } from '../components/viajes/VehiculoAssigner';

export function useAssignmentValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateAssignment = useCallback(
    (id: string, assignment: VehiculoAssignment, allAssignments: VehiculoAssignment[]) => {
      const newErrors = { ...errors };

      // Limpiar errores previos para este assignment
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(id)) {
          delete newErrors[key];
        }
      });

      // Validar vehículo seleccionado
      if (!assignment.vehiculo) {
        newErrors[`${id}.vehiculo`] = 'Debe seleccionar un vehículo';
      }

      // Validar conductor
      if (!assignment.conductor) {
        newErrors[`${id}.conductor`] = 'Debe asignar un conductor';
      }

      // Validar cantidad de camiones
      if (!assignment.cantidadCamiones || assignment.cantidadCamiones < 1) {
        newErrors[`${id}.cantidadCamiones`] = 'Cantidad debe ser mayor a 0';
      }

      // Validar duplicados de vehículo
      const vehiculoUsed =
        allAssignments.filter((a) => a.id !== id && a.vehiculo?._id === assignment.vehiculo?._id)
          .length > 0;

      if (vehiculoUsed) {
        newErrors[`${id}.vehiculo`] = 'Este vehículo ya está asignado';
      }

      // Validar duplicados de conductor
      const conductorUsed =
        allAssignments.filter((a) => a.id !== id && a.conductor?._id === assignment.conductor?._id)
          .length > 0;

      if (conductorUsed) {
        newErrors[`${id}.conductor`] = 'Este conductor ya está asignado';
      }

      setErrors(newErrors);
    },
    [errors]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validateAssignment,
    clearErrors,
  };
}
