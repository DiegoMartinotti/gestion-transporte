import { notifications } from '@mantine/notifications';
import { Viaje, ViajeFormData } from '../../../types/viaje';
import { Cliente } from '../../../types/cliente';
import { Tramo } from '../../../types';

// Type definitions for better type safety
interface ValidationErrors {
  [key: string]: string;
}

interface CalculationResult {
  montoBase: number;
  desglose: {
    tarifaBase: number;
    incrementoPeso: number;
    incrementoDistancia: number;
  };
  formula: string;
  montoExtras: number;
  montoTotal: number;
}

interface Extra {
  id: string;
  concepto: string;
  monto: number;
  descripcion: string;
}

// Form validation helpers
export const validateBasicStep = (values: ViajeFormData): ValidationErrors => {
  const errors: ValidationErrors = {};
  if (!values.fecha) errors.fecha = 'Fecha requerida';
  if (!values.cliente) errors.cliente = 'Cliente requerido';
  if (!values.tramo) errors.tramo = 'Tramo requerido';
  return errors;
};

export const validateResourcesStep = (values: ViajeFormData): ValidationErrors => {
  const errors: ValidationErrors = {};
  if (!values.vehiculos.length) errors.vehiculos = 'Al menos un vehículo requerido';
  if (!values.choferes.length) errors.choferes = 'Al menos un chofer requerido';
  return errors;
};

export const validateCargoStep = (values: ViajeFormData): ValidationErrors => {
  const errors: ValidationErrors = {};
  if (!values.carga.peso || values.carga.peso <= 0) {
    errors['carga.peso'] = 'Peso de carga requerido';
  }
  if (!values.distanciaKm || values.distanciaKm <= 0) {
    errors.distanciaKm = 'Distancia requerida';
  }
  return errors;
};

export const getStepValidator = (step: number) => {
  const validators = [validateBasicStep, validateResourcesStep, validateCargoStep];
  return validators[step] || (() => ({}));
};

// Helper functions for form initialization
const getClienteId = (cliente?: Viaje['cliente']): string => {
  if (!cliente) return '';
  return typeof cliente === 'string' ? cliente : cliente._id || '';
};

const getVehiculoIds = (vehiculos?: Viaje['vehiculos']): string[] => {
  if (!vehiculos) return [];
  return vehiculos
    .map((v) => (typeof v.vehiculo === 'object' ? v.vehiculo._id : v.vehiculo))
    .filter(Boolean);
};

const getBaseData = (viaje?: Viaje) => ({
  fecha: viaje?.fecha ? new Date(viaje.fecha) : new Date(),
  cliente: getClienteId(viaje?.cliente),
  tramo: viaje?.tramo?._id || '',
  numeroViaje: parseInt(viaje?.numeroViaje?.toString() || '0'),
  estado: viaje?.estado || 'PENDIENTE',
});

const getVehiculosData = (viaje?: Viaje) => ({
  vehiculos: getVehiculoIds(viaje?.vehiculos),
  choferes: viaje?.choferes?.map((c) => c._id || c.toString()).filter(Boolean) || [],
  ayudantes: viaje?.ayudantes?.map((a) => a._id || a.toString()).filter(Boolean) || [],
});

const getCargaData = (viaje?: Viaje) => ({
  carga: {
    peso: viaje?.carga?.peso || 0,
    volumen: viaje?.carga?.volumen || 0,
    descripcion: viaje?.carga?.descripcion || '',
    peligrosa: viaje?.carga?.peligrosa || false,
    refrigerada: viaje?.carga?.refrigerada || false,
  },
});

const getAdditionalData = (viaje?: Viaje) => ({
  distanciaKm: viaje?.distanciaKm || 0,
  tiempoEstimadoHoras: viaje?.tiempoEstimadoHoras || 0,
  ordenCompra: viaje?.ordenCompra || '',
  observaciones: viaje?.observaciones || '',
  extras: viaje?.extras || [],
});

const getMontoData = (viaje?: Viaje) => ({
  montoBase: viaje?.montoBase || 0,
  montoExtras: viaje?.montoExtras || 0,
  montoTotal: viaje?.montoTotal || 0,
});

// Form initialization helpers
export const getInitialViajeFormData = (viaje?: Viaje): ViajeFormData => {
  return {
    ...getBaseData(viaje),
    ...getVehiculosData(viaje),
    ...getCargaData(viaje),
    ...getAdditionalData(viaje),
    ...getMontoData(viaje),
  };
};

export const createNewExtra = (): Extra => ({
  id: Date.now().toString(),
  concepto: '',
  monto: 0,
  descripcion: '',
});

// Utility functions
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(value);
};

// Calculation helpers
export const simulateCalculation = (formValues: ViajeFormData): CalculationResult => {
  const result = {
    montoBase: 15000,
    desglose: {
      tarifaBase: 12000,
      incrementoPeso: 2000,
      incrementoDistancia: 1000,
    },
    formula: 'tarifaBase + (peso * 0.5) + (distancia * 10)',
    montoExtras: formValues.extras.reduce((sum, extra) => sum + (extra.monto || 0), 0),
    montoTotal: 0,
  };
  result.montoTotal = result.montoBase + result.montoExtras;
  return result;
};

// Notification helpers
export const showCalculationSuccess = (total: number) => {
  notifications.show({
    title: 'Cálculo completado',
    message: `Monto total: $${total.toLocaleString()}`,
    color: 'green',
  });
};

export const showCalculationError = () => {
  notifications.show({
    title: 'Error en cálculo',
    message: 'No se pudo calcular la tarifa',
    color: 'red',
  });
};

export const showValidationError = () => {
  notifications.show({
    title: 'Error',
    message: 'Selecciona cliente y tramo antes de calcular',
    color: 'red',
  });
};

export const showSaveSuccess = (isUpdate: boolean) => {
  notifications.show({
    title: isUpdate ? 'Viaje actualizado' : 'Viaje creado',
    message: isUpdate
      ? 'Los cambios se guardaron correctamente'
      : 'El viaje se registró correctamente',
    color: 'green',
  });
};

export const showSaveError = () => {
  notifications.show({
    title: 'Error',
    message: 'No se pudo guardar el viaje',
    color: 'red',
  });
};

// Form data helpers
export const updateFormWithTramoData = (
  tramo: Tramo | null,
  setFieldValue: (field: string, value: number) => void
) => {
  if (!tramo) return;
  if (tramo.distancia) {
    setFieldValue('distanciaKm', tramo.distancia);
  }
};

export const updateFormWithCalculation = (
  result: CalculationResult,
  setFieldValue: (field: string, value: number) => void
) => {
  setFieldValue('montoBase', result.montoBase);
  setFieldValue('montoExtras', result.montoExtras);
  setFieldValue('montoTotal', result.montoTotal);
};

// Validation helpers
export const canCalculateTarifa = (
  selectedCliente: Cliente | null,
  selectedTramo: Tramo | null
): boolean => {
  return Boolean(selectedCliente && selectedTramo);
};

// Extra management helpers
export const updateExtraField = (
  extras: Extra[],
  update: { index: number; field: keyof Extra; value: string | number },
  setFieldValue: (field: string, value: Extra[]) => void
) => {
  const newExtras = [...extras];
  newExtras[update.index] = { ...newExtras[update.index], [update.field]: update.value };
  setFieldValue('extras', newExtras);
};

export const removeExtra = (
  extras: Extra[],
  index: number,
  setFieldValue: (field: string, value: Extra[]) => void
) => {
  const newExtras = extras.filter((_, i) => i !== index);
  setFieldValue('extras', newExtras);
};

export const addExtra = (
  extras: Extra[],
  setFieldValue: (field: string, value: Extra[]) => void
) => {
  const newExtra = createNewExtra();
  setFieldValue('extras', [...extras, newExtra]);
};
// Handler helpers for useViajeForm
interface CalculateHandlerConfig {
  selectedCliente: Cliente | null;
  selectedTramo: Tramo | null;
  formValues: ViajeFormData;
  setCalculating: (value: boolean) => void;
  setCalculationResult: (result: CalculationResult | null) => void;
  setFieldValue: (field: string, value: number) => void;
}

export const createCalculateHandler = (config: CalculateHandlerConfig) => async () => {
  const {
    selectedCliente,
    selectedTramo,
    formValues,
    setCalculating,
    setCalculationResult,
    setFieldValue,
  } = config;
  if (!canCalculateTarifa(selectedCliente, selectedTramo)) {
    showValidationError();
    return;
  }

  setCalculating(true);
  try {
    const result = simulateCalculation(formValues);
    setCalculationResult(result);
    updateFormWithCalculation(result, setFieldValue);
    showCalculationSuccess(result.montoTotal);
  } catch (error) {
    showCalculationError();
  } finally {
    setCalculating(false);
  }
};

export const createSubmitHandler =
  (
    viaje: Viaje | undefined,
    saveViaje: (values: ViajeFormData, isUpdate: boolean) => Promise<unknown>,
    onSave: (viaje: ViajeFormData) => void
  ) =>
  async (values: ViajeFormData) => {
    try {
      const isUpdate = !!viaje;
      await saveViaje(values, isUpdate);
      showSaveSuccess(isUpdate);
      onSave(values);
    } catch (error) {
      showSaveError();
    }
  };

export const createClienteChangeHandler =
  (clientes: Cliente[], setSelectedCliente: (cliente: Cliente | null) => void) =>
  (clienteId: string) => {
    const cliente = clientes.find((c) => c._id === clienteId);
    setSelectedCliente(cliente || null);
  };

export const createTramoChangeHandler =
  (
    tramos: Tramo[],
    setSelectedTramo: (tramo: Tramo | null) => void,
    setFieldValue: (field: string, value: number) => void
  ) =>
  (tramoId: string) => {
    const tramo = tramos.find((t) => t._id === tramoId);
    setSelectedTramo(tramo || null);
    if (tramo) {
      updateFormWithTramoData(tramo, setFieldValue);
    }
  };
