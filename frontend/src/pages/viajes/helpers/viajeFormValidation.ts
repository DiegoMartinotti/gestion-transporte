import { ViajeFormData } from '../../../types/viaje';

export interface ValidationErrors {
  fecha?: string;
  cliente?: string;
  tramo?: string;
  vehiculos?: string;
  choferes?: string;
  'carga.peso'?: string;
  distanciaKm?: string;
}

// Helper functions for form validation
export const validateBasicInfo = (values: ViajeFormData): ValidationErrors => {
  const errors: ValidationErrors = {};
  if (!values.fecha) errors.fecha = 'Fecha requerida';
  if (!values.cliente) errors.cliente = 'Cliente requerido';
  if (!values.tramo) errors.tramo = 'Tramo requerido';
  return errors;
};

export const validateVehicleInfo = (values: ViajeFormData): ValidationErrors => {
  const errors: ValidationErrors = {};
  if (!values.vehiculos.length) errors.vehiculos = 'Al menos un vehículo requerido';
  if (!values.choferes.length) errors.choferes = 'Al menos un chofer requerido';
  return errors;
};

export const validateCargoInfo = (values: ViajeFormData): ValidationErrors => {
  const errors: ValidationErrors = {};
  if (!values.carga.peso || values.carga.peso <= 0) {
    errors['carga.peso'] = 'Peso de carga requerido';
  }
  if (!values.distanciaKm || values.distanciaKm <= 0) {
    errors.distanciaKm = 'Distancia requerida';
  }
  return errors;
};