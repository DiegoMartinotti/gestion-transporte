import type { Dispatch, SetStateAction } from 'react';
import { UseFormReturnType } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { ViajeFormData } from '../../../types/viaje';
import { simulateCalculation } from '../helpers/viajeFormUtils';

interface UseViajeFormHandlersProps {
  form: UseFormReturnType<ViajeFormData>;
  stepperStep: number;
  setStepperStep: Dispatch<SetStateAction<number>>;
  setCalculationModalOpened: Dispatch<SetStateAction<boolean>>;
  setIsCalculating: Dispatch<SetStateAction<boolean>>;
}

export const useViajeFormHandlers = ({
  form,
  stepperStep,
  setStepperStep,
  setCalculationModalOpened,
  setIsCalculating,
}: UseViajeFormHandlersProps) => {
  const showNotification = (type: 'success' | 'error', title: string, message: string) => {
    notifications.show({
      title,
      message,
      color: type === 'success' ? 'green' : 'red',
    });
  };

  const handleCalculateTarifa = async () => {
    setIsCalculating(true);
    try {
      const calculation = simulateCalculation(form.values);
      form.setFieldValue('total', calculation.montoTotal);
      showNotification('success', 'Cálculo realizado', 'La tarifa se calculó correctamente');
    } catch (error) {
      console.error('Error al calcular la tarifa', error);
      showNotification('error', 'Error', 'No se pudo calcular la tarifa');
    } finally {
      setIsCalculating(false);
      setCalculationModalOpened(false);
    }
  };

  const nextStep = () => {
    const { hasErrors } = form.validate();
    if (!hasErrors) {
      setStepperStep((current) => (current < 3 ? current + 1 : current));
    }
  };

  const prevStep = () => setStepperStep((current) => (current > 0 ? current - 1 : current));

  const isLastStep = stepperStep === 3;
  const canGoNext = !form.validate().hasErrors;

  return {
    showNotification,
    handleCalculateTarifa,
    nextStep,
    prevStep,
    isLastStep,
    canGoNext,
  };
};
