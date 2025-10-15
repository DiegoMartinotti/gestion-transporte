import { useState } from 'react';
import { Card, Group, Button, Stack, Title, Modal } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { TarifaCalculator } from '../../components/calculation/TarifaCalculator';
import { useClientes } from '../../hooks/useClientes';
import { useTramos } from '../../hooks/useTramos';
import { useViajes } from '../../hooks/useViajes';
import { Viaje, ViajeFormData } from '../../types/viaje';
import { ViajeFormStepper } from './components/ViajeFormStepper';
import {
  useStepper,
  useViajeCalculation,
  useViajeFormLogic,
  useSelectedEntities,
  useViajeHandlers,
} from './hooks/useViajeFormHelpers';

interface ViajeFormProps {
  viaje?: Viaje;
  onSave: (viaje: ViajeFormData) => void;
  onCancel: () => void;
}

export function ViajeForm({ viaje, onSave, onCancel }: ViajeFormProps) {
  const { activeStep, setActiveStep } = useStepper(4);
  const { calculating, setCalculating, calculationResult, setCalculationResult } =
    useViajeCalculation();
  const [showTarifaDetails, setShowTarifaDetails] = useState(false);

  const { clientes } = useClientes();
  const { tramos } = useTramos();
  const { createViaje, updateViaje } = useViajes();

  const form = useViajeFormLogic(viaje, activeStep);
  const { selectedTramo, selectedCliente } = useSelectedEntities(form, clientes, tramos);
  const { handleCalculateTarifa, handleAddExtra, handleRemoveExtra, handleSubmit } =
    useViajeHandlers({
      viaje,
      form,
      selectedCliente,
      selectedTramo,
      setCalculating,
      setCalculationResult,
      createViaje,
      updateViaje,
      onSave,
    });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);
  };

  const getFormErrorAsString = (error: unknown) => (typeof error === 'string' ? error : undefined);
  const isArrayValue = (value: unknown): string[] => (Array.isArray(value) ? value : []);
  const getNumberValue = (value: unknown) => (typeof value === 'number' ? value : 0);

  const tramoSummary = selectedTramo
    ? {
        denominacion:
          `${selectedTramo.origen?.nombre ?? ''} → ${selectedTramo.destino?.nombre ?? ''}`.trim(),
      }
    : null;

  return (
    <Stack>
      <Group justify="apart">
        <Title order={2}>{viaje ? `Editar Viaje #${viaje.numeroViaje}` : 'Nuevo Viaje'}</Title>
        <Group>
          <Button variant="light" color="gray" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            leftSection={<IconDeviceFloppy />}
            onClick={() => handleSubmit(form.values)}
            disabled={activeStep < 3}
          >
            Guardar Viaje
          </Button>
        </Group>
      </Group>

      <Card>
        <ViajeFormStepper
          activeStep={activeStep}
          setActiveStep={setActiveStep}
          form={form}
          selectedTramo={selectedTramo}
          selectedCliente={selectedCliente}
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
      </Card>

      <Modal
        opened={showTarifaDetails}
        onClose={() => setShowTarifaDetails(false)}
        title="Detalles del Cálculo"
        size="lg"
      >
        {calculationResult && (
          <Stack>
            <TarifaCalculator
              cliente={selectedCliente}
              tramo={tramoSummary}
              datos={{
                peso: form.values.carga.peso,
                volumen: form.values.carga.volumen,
                distancia: form.values.distanciaKm,
                vehiculos: form.values.vehiculos.length,
              }}
              resultado={calculationResult}
            />
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
