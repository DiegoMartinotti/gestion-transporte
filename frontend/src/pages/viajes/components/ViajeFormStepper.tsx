import React from 'react';
import { Card, Group, Button, Stepper, Modal } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { TarifaCalculator } from '../../../components/calculation/TarifaCalculator';
import { ViajeFormData } from '../../../types/viaje';
import { Cliente } from '../../../types/cliente';
import { Tramo } from '../../../types/tramo';
import { ViajeFormStep1 } from './ViajeFormStep1';
import { ViajeFormStep2 } from './ViajeFormStep2';
import { ViajeFormStep3 } from './ViajeFormStep3';
import { ViajeFormStep4 } from './ViajeFormStep4';

interface ViajeFormStepperProps {
  form: UseFormReturnType<ViajeFormData>;
  stepperStep: number;
  setStepperStep: (step: number) => void;
  clientes: Cliente[];
  tramos: Tramo[];
  nextStep: () => void;
  prevStep: () => void;
  isLastStep: boolean;
  canGoNext: boolean;
  calculationModalOpened: boolean;
  setCalculationModalOpened: (opened: boolean) => void;
  handleCalculateTarifa: () => Promise<void>;
  isCalculating: boolean;
}

export const ViajeFormStepper = ({
  form,
  stepperStep,
  setStepperStep,
  clientes,
  tramos,
  nextStep,
  prevStep,
  isLastStep,
  canGoNext,
  calculationModalOpened,
  setCalculationModalOpened,
  handleCalculateTarifa,
  isCalculating,
}: ViajeFormStepperProps) => {
  return (
    <>
      <Card>
        <Stepper active={stepperStep} onStepClick={setStepperStep} breakpoint="sm">
          <Stepper.Step label="Información Básica" description="Cliente, tramo y fecha">
            <ViajeFormStep1 form={form} clientes={clientes} tramos={tramos} />
          </Stepper.Step>

          <Stepper.Step label="Vehículos y Personal" description="Asignar recursos">
            <ViajeFormStep2 form={form} />
          </Stepper.Step>

          <Stepper.Step label="Carga y Distancia" description="Detalles del transporte">
            <ViajeFormStep3 form={form} />
          </Stepper.Step>

          <Stepper.Step label="Revisión Final" description="Confirmar información">
            <ViajeFormStep4 form={form} />
          </Stepper.Step>
        </Stepper>

        <Group justify="center" mt="xl">
          {stepperStep > 0 && (
            <Button variant="default" onClick={prevStep}>
              Anterior
            </Button>
          )}
          {!isLastStep && (
            <Button onClick={nextStep} disabled={!canGoNext}>
              Siguiente
            </Button>
          )}
        </Group>
      </Card>

      <Modal
        opened={calculationModalOpened}
        onClose={() => setCalculationModalOpened(false)}
        title="Calculadora de Tarifa"
        size="lg"
      >
        <TarifaCalculator
          cliente={form.values.cliente}
          tramo={form.values.tramo}
          carga={form.values.carga}
          vehiculos={form.values.vehiculos}
          distancia={form.values.distanciaKm}
          onCalculate={handleCalculateTarifa}
          loading={isCalculating}
        />
      </Modal>
    </>
  );
};