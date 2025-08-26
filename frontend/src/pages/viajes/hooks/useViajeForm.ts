import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
  getInitialViajeFormData,
  getStepValidator,
  updateFormWithTramoData,
  createCalculateHandler,
  createSubmitHandler,
  createClienteChangeHandler,
  createTramoChangeHandler,
} from '../helpers/viajeFormHelpers';
import { useClientes } from '../../../hooks/useClientes';
import { useTramos } from '../../../hooks/useTramos';
import { useViajes } from '../../../hooks/useViajes';
import { Viaje, ViajeFormData } from '../../../types/viaje';
import { Cliente } from '../../../types/cliente';
import { Tramo } from '../../../types';

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

interface UseViajeFormProps {
  viaje?: Viaje;
  onSave: (viaje: ViajeFormData) => void;
}

export const useViajeForm = ({ viaje, onSave }: UseViajeFormProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [showTarifaDetails, setShowTarifaDetails] = useState(false);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [selectedTramo, setSelectedTramo] = useState<Tramo | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const { clientes } = useClientes();
  const { tramos } = useTramos();
  const { createViaje, updateViaje } = useViajes();

  const validateByStep = (values: ViajeFormData) => {
    return getStepValidator(activeStep)(values);
  };

  const form = useForm<ViajeFormData>({
    initialValues: getInitialViajeFormData(viaje),
    validate: validateByStep,
  });

  // Data synchronization effects
  useEffect(() => {
    if (form.values.cliente) {
      const cliente = clientes.find((c) => c._id === form.values.cliente);
      setSelectedCliente(cliente || null);
    }
  }, [form.values.cliente, clientes]);

  useEffect(() => {
    if (form.values.tramo && tramos.length > 0) {
      const tramo = tramos.find((t) => t._id === form.values.tramo);
      setSelectedTramo(tramo || null);
      if (tramo) {
        updateFormWithTramoData(tramo, form.setFieldValue);
      }
    }
  }, [form.values.tramo, tramos, form.setFieldValue]);

  const saveViaje = async (values: ViajeFormData, isUpdate: boolean) => {
    if (isUpdate && viaje) {
      return await updateViaje(viaje._id, values);
    }
    return await createViaje(values);
  };

  // Create handlers using helper functions
  const handleCalculateTarifa = createCalculateHandler({
    selectedCliente,
    selectedTramo,
    formValues: form.values,
    setCalculating,
    setCalculationResult,
    setFieldValue: form.setFieldValue,
  });

  const handleSubmit = createSubmitHandler(viaje, saveViaje, onSave);

  const handleClienteChange = createClienteChangeHandler(clientes, setSelectedCliente);

  const handleTramoChange = createTramoChangeHandler(tramos, setSelectedTramo, form.setFieldValue);

  const nextStep = () => {
    const errors = form.validate();
    if (Object.keys(errors.errors).length === 0) {
      setActiveStep((current) => Math.min(current + 1, 3));
    }
  };

  const prevStep = () => {
    setActiveStep((current) => Math.max(current - 1, 0));
  };

  return {
    // Form state
    form,
    activeStep,
    setActiveStep,

    // Calculation state
    calculating,
    calculationResult,
    showTarifaDetails,
    setShowTarifaDetails,

    // Selected items
    selectedCliente,
    selectedTramo,

    // Actions
    handleCalculateTarifa,
    handleSubmit,
    nextStep,
    prevStep,
    handleClienteChange,
    handleTramoChange,

    // Data
    viaje,
  };
};
