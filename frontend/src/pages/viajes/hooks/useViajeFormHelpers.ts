import { useState, useEffect } from 'react';
import { useForm, UseFormReturnType } from '@mantine/form';
import { ViajeFormData, Viaje } from '../../../types/viaje';
import { Cliente } from '../../../types/cliente';
import { Tramo } from '../../../types/index';
import { notifications } from '@mantine/notifications';
import { simulateCalculation, getInitialVehiculos } from '../helpers/viajeFormUtils';

// Helper function for showing notifications
export const showNotification = (type: 'success' | 'error', title: string, message: string) => {
  notifications.show({
    title,
    message,
    color: type === 'success' ? 'green' : 'red',
  });
};

// Helper function for form submission
export const submitViaje = async (
  viaje: Viaje | undefined,
  values: ViajeFormData,
  updateViaje: (id: string, data: ViajeFormData) => Promise<void>,
  createViaje: (data: ViajeFormData) => Promise<void>
) => {
  if (viaje) {
    await updateViaje(viaje._id, values);
    showNotification('success', 'Viaje actualizado', 'Los cambios se guardaron correctamente');
  } else {
    await createViaje(values);
    showNotification('success', 'Viaje creado', 'El viaje se registró correctamente');
  }
};

// Hook personalizado para manejo de stepper
export const useStepper = (maxSteps: number) => {
  const [activeStep, setActiveStep] = useState(0);

  const nextStep = () =>
    setActiveStep((current) => (current < maxSteps - 1 ? current + 1 : current));
  const prevStep = () => setActiveStep((current) => (current > 0 ? current - 1 : current));

  return { activeStep, setActiveStep, nextStep, prevStep };
};

// Hook personalizado para manejo de cálculos
export const useViajeCalculation = () => {
  const [calculating, setCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<{
    montoBase: number;
    montoExtras: number;
    montoTotal: number;
  } | null>(null);

  return { calculating, setCalculating, calculationResult, setCalculationResult };
};

// Helper para datos básicos del viaje
export const getBasicData = (viaje?: Viaje) => ({
  fecha: viaje?.fecha ? new Date(viaje.fecha) : new Date(),
  cliente: typeof viaje?.cliente === 'string' ? viaje.cliente : viaje?.cliente?._id || '',
  tramo: viaje?.tramo?._id || '',
  numeroViaje: parseInt(viaje?.numeroViaje || '0'),
});

// Helper para datos de carga
export const getCargoData = (viaje?: Viaje) => ({
  peso: viaje?.carga?.peso || 0,
  volumen: viaje?.carga?.volumen || 0,
  descripcion: viaje?.carga?.descripcion || '',
  peligrosa: viaje?.carga?.peligrosa || false,
  refrigerada: viaje?.carga?.refrigerada || false,
});

// Helper para datos adicionales
export const getAdditionalData = (viaje?: Viaje) => ({
  distanciaKm: viaje?.distanciaKm || 0,
  tiempoEstimadoHoras: viaje?.tiempoEstimadoHoras || 0,
  ordenCompra: viaje?.ordenCompra || '',
  observaciones: viaje?.observaciones || '',
  extras: viaje?.extras || [],
  estado: viaje?.estado || 'PENDIENTE',
});

// Helper para datos monetarios
export const getMonetaryData = (viaje?: Viaje) => ({
  montoBase: viaje?.montoBase || 0,
  montoExtras: viaje?.montoExtras || 0,
  montoTotal: viaje?.montoTotal || 0,
});

// Helper para valores iniciales del formulario
export const getInitialFormValues = (viaje?: Viaje): ViajeFormData => ({
  ...getBasicData(viaje),
  vehiculos: getInitialVehiculos(viaje),
  choferes: viaje?.choferes?.map((c) => c._id) || [],
  ayudantes: viaje?.ayudantes?.map((a) => a._id) || [],
  carga: getCargoData(viaje),
  ...getAdditionalData(viaje),
  ...getMonetaryData(viaje),
});

// Validation helpers
export const validateBasicInfo = (_values: ViajeFormData) => {
  return {};
};

export const validateVehicleInfo = (_values: ViajeFormData) => {
  return {};
};

export const validateCargoInfo = (_values: ViajeFormData) => {
  return {};
};

// Hook para la lógica del formulario
export const useViajeFormLogic = (viaje: Viaje | undefined, activeStep: number) => {
  return useForm<ViajeFormData>({
    initialValues: getInitialFormValues(viaje),
    validate: (values) => {
      switch (activeStep) {
        case 0:
          return validateBasicInfo(values);
        case 1:
          return validateVehicleInfo(values);
        case 2:
          return validateCargoInfo(values);
        default:
          return {};
      }
    },
  });
};

// Hook para el estado de selección
export const useSelectedEntities = (
  form: UseFormReturnType<ViajeFormData>,
  clientes: Cliente[],
  tramos: Tramo[]
) => {
  const [selectedTramo, setSelectedTramo] = useState<Tramo | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  useEffect(() => {
    if (form.values.cliente) {
      const cliente = clientes.find((c) => c._id === form.values.cliente);
      setSelectedCliente(cliente || null);
    }
  }, [form.values.cliente, clientes]);

  useEffect(() => {
    if (form.values.tramo) {
      const tramo = tramos.find((t) => t._id === form.values.tramo);
      setSelectedTramo(tramo || null);
      if (tramo?.distancia) {
        form.setFieldValue('distanciaKm', tramo.distancia);
      }
      // Nota: El campo tiempoEstimadoHoras no está disponible en la interfaz Tramo actual
    }
  }, [form.values.tramo, tramos, form]);

  return { selectedTramo, selectedCliente };
};

// Tipo para los parámetros de useViajeHandlers
export interface ViajeHandlersParams {
  viaje: Viaje | undefined;
  form: UseFormReturnType<ViajeFormData>;
  selectedCliente: Cliente | null;
  selectedTramo: Tramo | null;
  setCalculating: (value: boolean) => void;
  setCalculationResult: (
    value: { montoBase: number; montoExtras: number; montoTotal: number } | null
  ) => void;
  createViaje: (data: ViajeFormData) => Promise<void>;
  updateViaje: (id: string, data: ViajeFormData) => Promise<void>;
  onSave: (values: ViajeFormData) => void;
}

// Hook para handlers del formulario
export const useViajeHandlers = (params: ViajeHandlersParams) => {
  const {
    viaje,
    form,
    selectedCliente,
    selectedTramo,
    setCalculating,
    setCalculationResult,
    createViaje,
    updateViaje,
    onSave,
  } = params;

  const handleCalculateTarifa = async () => {
    if (!selectedCliente || !selectedTramo) {
      showNotification('error', 'Error', 'Selecciona cliente y tramo antes de calcular');
      return;
    }

    setCalculating(true);
    try {
      const result = simulateCalculation(form.values);
      setCalculationResult(result);
      form.setFieldValue('montoBase', result.montoBase);
      form.setFieldValue('montoExtras', result.montoExtras);
      form.setFieldValue('montoTotal', result.montoTotal);
      showNotification(
        'success',
        'Cálculo completado',
        `Monto total: $${result.montoTotal.toLocaleString()}`
      );
    } catch (error) {
      showNotification('error', 'Error en cálculo', 'No se pudo calcular la tarifa');
    } finally {
      setCalculating(false);
    }
  };

  const handleAddExtra = () => {
    const newExtra = {
      id: Date.now().toString(),
      concepto: '',
      monto: 0,
      descripcion: '',
    };
    form.setFieldValue('extras', [...form.values.extras, newExtra]);
  };

  const handleRemoveExtra = (index: number) => {
    const newExtras = form.values.extras.filter((_, i: number) => i !== index);
    form.setFieldValue('extras', newExtras);
  };

  const handleSubmit = async (values: ViajeFormData) => {
    try {
      await submitViaje(viaje, values, updateViaje, createViaje);
      onSave(values);
    } catch (error) {
      showNotification('error', 'Error', 'No se pudo guardar el viaje');
    }
  };

  return { handleCalculateTarifa, handleAddExtra, handleRemoveExtra, handleSubmit };
};
