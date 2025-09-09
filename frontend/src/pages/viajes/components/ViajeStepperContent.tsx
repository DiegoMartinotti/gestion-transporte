import { Stack, Stepper, Alert, Text } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import {
  IconTruck,
  IconClock,
  IconCurrencyDollar,
  IconInfoCircle,
  IconCheck,
} from '@tabler/icons-react';
import { ViajeFormData } from '../../../types/viaje';
import { Tramo } from '../../../types/index';
import { ViajeFormBasicStep } from './ViajeFormBasicStep';
import { ViajeFormVehicleStep } from './ViajeFormVehicleStep';
import { ViajeFormCargoStep } from './ViajeFormCargoStep';
import { ViajeFormBillingStep } from './ViajeFormBillingStep';

interface ViajeStepperContentProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  form: UseFormReturnType<ViajeFormData>;
  selectedTramo: Tramo | null;
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

export function ViajeStepperContent({
  activeStep,
  setActiveStep,
  form,
  selectedTramo,
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
}: ViajeStepperContentProps) {
  return (
    <Stepper active={activeStep} onStepClick={setActiveStep}>
      <Stepper.Step
        label="Información Básica"
        description="Cliente, ruta y fecha"
        icon={<IconInfoCircle />}
      >
        <Stack mt="md">
          <ViajeFormBasicStep
            form={form}
            selectedTramo={selectedTramo}
            getFormErrorAsString={getFormErrorAsString}
          />
        </Stack>
      </Stepper.Step>

      <Stepper.Step
        label="Vehículos y Personal"
        description="Asignación de recursos"
        icon={<IconTruck />}
      >
        <Stack mt="md">
          <ViajeFormVehicleStep
            form={form}
            getFormErrorAsString={getFormErrorAsString}
            isArrayValue={isArrayValue}
          />
        </Stack>
      </Stepper.Step>

      <Stepper.Step
        label="Detalles de Carga"
        description="Información del transporte"
        icon={<IconClock />}
      >
        <Stack mt="md">
          <ViajeFormCargoStep form={form} />
        </Stack>
      </Stepper.Step>

      <Stepper.Step
        label="Cálculo y Facturación"
        description="Tarifas y costos"
        icon={<IconCurrencyDollar />}
      >
        <Stack mt="md">
          <ViajeFormBillingStep
            form={form}
            calculating={calculating}
            calculationResult={calculationResult}
            handleCalculateTarifa={handleCalculateTarifa}
            handleAddExtra={handleAddExtra}
            handleRemoveExtra={handleRemoveExtra}
            setShowTarifaDetails={setShowTarifaDetails}
            getNumberValue={getNumberValue}
            formatCurrency={formatCurrency}
          />
        </Stack>
      </Stepper.Step>

      <Stepper.Completed>
        <Alert icon={<IconCheck />} color="green">
          <Text fw={500}>Viaje listo para guardar</Text>
          <Text size="sm">Revisa todos los datos antes de confirmar el guardado del viaje.</Text>
        </Alert>
      </Stepper.Completed>
    </Stepper>
  );
}
