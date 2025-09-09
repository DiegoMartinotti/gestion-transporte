import { Group, Button } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { ViajeFormData } from '../../../types/viaje';
import { Cliente } from '../../../types/cliente';
import { Tramo } from '../../../types/index';
import { ViajeStepperContent } from './ViajeStepperContent';

interface ViajeFormStepperProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  form: UseFormReturnType<ViajeFormData>;
  selectedTramo: Tramo | null;
  selectedCliente: Cliente | null;
  calculating: boolean;
  calculationResult: {
    montoBase: number;
    montoExtras: number;
    montoTotal: number;
  } | null;
  handleCalculateTarifa: () => void;
  handleAddExtra: () => void;
  handleRemoveExtra: (index: number) => void;
  setShowTarifaDetails: (value: boolean) => void;
  getFormErrorAsString: (error: unknown) => string | undefined;
  isArrayValue: (value: unknown) => string[];
  getNumberValue: (value: unknown) => number;
  formatCurrency: (value: number) => string;
}

export function ViajeFormStepper({
  activeStep,
  setActiveStep,
  form,
  selectedTramo,
  selectedCliente: _selectedCliente,
  calculating,
  calculationResult,
  handleCalculateTarifa,
  handleAddExtra,
  handleRemoveExtra,
  setShowTarifaDetails,
  getFormErrorAsString,
  isArrayValue,
  getNumberValue,
  formatCurrency,
}: ViajeFormStepperProps) {
  const handleNextStep = () => {
    const errors = form.validate();
    if (Object.keys(errors.errors).length === 0) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrevStep = () => {
    setActiveStep(activeStep - 1);
  };

  return (
    <>
      <ViajeStepperContent
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        form={form}
        selectedTramo={selectedTramo}
        calculating={calculating}
        calculationResult={calculationResult}
        handleCalculateTarifa={handleCalculateTarifa}
        handleAddExtra={handleAddExtra}
        handleRemoveExtra={handleRemoveExtra}
        setShowTarifaDetails={setShowTarifaDetails}
        getFormErrorAsString={getFormErrorAsString}
        isArrayValue={isArrayValue}
        getNumberValue={getNumberValue}
        formatCurrency={formatCurrency}
      />

      <Group justify="center" mt="xl">
        <Button variant="default" onClick={handlePrevStep} disabled={activeStep === 0}>
          Anterior
        </Button>
        <Button onClick={handleNextStep} disabled={activeStep === 3}>
          Siguiente
        </Button>
      </Group>
    </>
  );
}
