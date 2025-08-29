import React from 'react';
import {
  Group,
  Button,
  Stack,
  Title,
} from '@mantine/core';
import {
  IconDeviceFloppy,
  IconCalculator,
} from '@tabler/icons-react';
import { useClientes } from '../../hooks/useClientes';
import { useTramos } from '../../hooks/useTramos';
import { useViajes } from '../../hooks/useViajes';
import { Viaje, ViajeFormData } from '../../types/viaje';
import { useViajeForm } from './hooks/useViajeForm';
import { useViajeFormHandlers } from './hooks/useViajeFormHandlers';
import { ViajeFormStepper } from './components/ViajeFormStepper';

interface ViajeFormProps {
  viaje?: Viaje;
  onSave: (viaje: ViajeFormData) => void;
  onCancel: () => void;
}

const ViajeFormContent = ({ viaje, onSave, onCancel }: ViajeFormProps) => {
  const { updateViaje, createViaje } = useViajes();
  const { clientes } = useClientes();
  const { tramos } = useTramos();

  const { form, stepperConfig, handleSubmit, handleCancel } = useViajeForm({
    viaje,
    onSave,
    onCancel,
  });

  const {
    stepperStep,
    setStepperStep,
    calculationModalOpened,
    setCalculationModalOpened,
    isCalculating,
    setIsCalculating,
  } = stepperConfig;

  const {
    showNotification,
    handleCalculateTarifa,
    nextStep,
    prevStep,
    isLastStep,
    canGoNext,
  } = useViajeFormHandlers({
    form,
    stepperStep,
    setStepperStep,
    setCalculationModalOpened,
    setIsCalculating,
  });

  const handleFormSubmit = async (values: ViajeFormData) => {
    try {
      if (viaje) {
        await updateViaje(viaje._id, values);
        showNotification('success', 'Viaje actualizado', 'Los cambios se guardaron correctamente');
      } else {
        await createViaje(values);
        showNotification('success', 'Viaje creado', 'El viaje se registró correctamente');
      }
      handleSubmit(values);
    } catch (error) {
      showNotification('error', 'Error', 'No se pudo guardar el viaje');
    }
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>{viaje ? 'Editar Viaje' : 'Nuevo Viaje'}</Title>
        <Group>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            variant="outline"
            leftSection={<IconCalculator size="1rem" />}
            onClick={() => setCalculationModalOpened(true)}
            disabled={!form.values.cliente || !form.values.tramo}
          >
            Calcular Tarifa
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size="1rem" />}
            onClick={form.onSubmit(handleFormSubmit)}
            disabled={!canGoNext}
          >
            {viaje ? 'Actualizar' : 'Guardar'}
          </Button>
        </Group>
      </Group>

      <ViajeFormStepper
        form={form}
        stepperStep={stepperStep}
        setStepperStep={setStepperStep}
        clientes={clientes}
        tramos={tramos}
        nextStep={nextStep}
        prevStep={prevStep}
        isLastStep={isLastStep}
        canGoNext={canGoNext}
        calculationModalOpened={calculationModalOpened}
        setCalculationModalOpened={setCalculationModalOpened}
        handleCalculateTarifa={handleCalculateTarifa}
        isCalculating={isCalculating}
      />
    </Stack>
  );
};

export const ViajeForm = ViajeFormContent;