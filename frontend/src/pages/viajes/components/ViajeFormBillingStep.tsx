import { Group, Text, Button, Divider } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import { ViajeFormData } from '../../../types/viaje';
import { TarifaCalculationPanel } from './TarifaCalculationPanel';
import { ExtraFormItem } from './ExtraFormItem';

interface CalculationResult {
  montoBase: number;
  montoExtras: number;
  montoTotal: number;
}

interface ViajeFormBillingStepProps {
  form: UseFormReturnType<ViajeFormData>;
  calculating: boolean;
  calculationResult: CalculationResult | null;
  handleCalculateTarifa: () => void;
  handleAddExtra: () => void;
  handleRemoveExtra: (index: number) => void;
  setShowTarifaDetails: (value: boolean) => void;
  getNumberValue: (value: unknown) => number;
  formatCurrency: (value: number) => string;
}

export function ViajeFormBillingStep({
  form,
  calculating,
  calculationResult,
  handleCalculateTarifa,
  handleAddExtra,
  handleRemoveExtra,
  setShowTarifaDetails,
  getNumberValue,
  formatCurrency,
}: ViajeFormBillingStepProps) {
  return (
    <>
      <TarifaCalculationPanel
        calculating={calculating}
        calculationResult={calculationResult}
        handleCalculateTarifa={handleCalculateTarifa}
        setShowTarifaDetails={setShowTarifaDetails}
        formatCurrency={formatCurrency}
        isDisabled={!form.values.cliente || !form.values.tramo}
      />

      <Divider label="Extras" labelPosition="left" />

      <Group justify="apart">
        <Text fw={500}>Cargos Adicionales</Text>
        <Button leftSection={<IconPlus />} variant="light" onClick={handleAddExtra}>
          Agregar Extra
        </Button>
      </Group>

      {form.values.extras.map((extra, index) => (
        <ExtraFormItem
          key={extra.id}
          extra={extra}
          index={index}
          form={form}
          handleRemoveExtra={handleRemoveExtra}
          getNumberValue={getNumberValue}
        />
      ))}

      {form.values.extras.length === 0 && (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          No hay extras agregados
        </Text>
      )}
    </>
  );
}
