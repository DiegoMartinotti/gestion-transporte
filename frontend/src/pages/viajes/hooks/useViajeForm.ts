import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import { Viaje, ViajeFormData } from '../../../types/viaje';
import { getDefaultFormValues } from '../helpers/viajeFormUtils';
import { validateBasicInfo, validateVehicleInfo, validateCargoInfo } from '../helpers/viajeFormValidation';

interface UseViajeFormProps {
  viaje?: Viaje;
  onSave: (viaje: ViajeFormData) => void;
  onCancel: () => void;
}

interface FormStepperConfig {
  stepperStep: number;
  setStepperStep: (step: number) => void;
  calculationModalOpened: boolean;
  setCalculationModalOpened: (opened: boolean) => void;
  isCalculating: boolean;
  setIsCalculating: (calculating: boolean) => void;
}

export const useViajeForm = ({ viaje, onSave, onCancel }: UseViajeFormProps) => {
  const [stepperStep, setStepperStep] = useState(0);
  const [calculationModalOpened, setCalculationModalOpened] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const form = useForm<ViajeFormData>({
    initialValues: getDefaultFormValues(viaje),
    validate: (values) => {
      switch (stepperStep) {
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

  // Update form when viaje prop changes
  useEffect(() => {
    if (viaje) {
      form.setValues(getDefaultFormValues(viaje));
    }
  }, [viaje, form]);

  const stepperConfig: FormStepperConfig = {
    stepperStep,
    setStepperStep,
    calculationModalOpened,
    setCalculationModalOpened,
    isCalculating,
    setIsCalculating,
  };

  const handleSubmit = (values: ViajeFormData) => {
    onSave(values);
  };

  const handleCancel = () => {
    onCancel();
  };

  return {
    form,
    stepperConfig,
    handleSubmit,
    handleCancel,
  };
};