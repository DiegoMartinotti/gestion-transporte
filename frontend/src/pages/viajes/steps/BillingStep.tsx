import React from 'react';
import {
  Stack,
  Group,
  Text,
  Button,
  Paper,
  Grid,
  Divider,
  TextInput,
  NumberInput,
  ActionIcon,
} from '@mantine/core';
import { IconCalculator, IconInfoCircle, IconPlus, IconTrash } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import {
  formatCurrency,
  updateExtraField,
  removeExtra,
  addExtra,
} from '../helpers/viajeFormHelpers';
import { ViajeFormData } from '../../../types/viaje';

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

interface Extra {
  id: string;
  concepto: string;
  monto: number;
  descripcion: string;
}

interface BillingStepProps {
  form: UseFormReturnType<ViajeFormData>;
  calculating: boolean;
  calculationResult: CalculationResult | null;
  onCalculate: () => void;
  onShowDetails: () => void;
}

const CalculationHeader: React.FC<{
  onCalculate: () => void;
  calculating: boolean;
  hasRequiredData: boolean;
  calculationResult: CalculationResult | null;
  onShowDetails: () => void;
}> = ({ onCalculate, calculating, hasRequiredData, calculationResult, onShowDetails }) => (
  <Group justify="apart">
    <Text fw={500}>Cálculo de Tarifa</Text>
    <Group>
      <Button
        leftSection={<IconCalculator />}
        onClick={onCalculate}
        loading={calculating}
        disabled={!hasRequiredData}
      >
        Calcular Tarifa
      </Button>
      {calculationResult && (
        <Button variant="light" leftSection={<IconInfoCircle />} onClick={onShowDetails}>
          Ver Detalles
        </Button>
      )}
    </Group>
  </Group>
);

const CalculationResult: React.FC<{ result: CalculationResult }> = ({ result }) => (
  <Paper p="md" withBorder>
    <Grid>
      <Grid.Col span={4}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          Monto Base
        </Text>
        <Text size="lg" fw={700}>
          {formatCurrency(result.montoBase)}
        </Text>
      </Grid.Col>
      <Grid.Col span={4}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          Extras
        </Text>
        <Text size="lg" fw={700}>
          {formatCurrency(result.montoExtras)}
        </Text>
      </Grid.Col>
      <Grid.Col span={4}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          Total
        </Text>
        <Text size="xl" fw={700} c="green">
          {formatCurrency(result.montoTotal)}
        </Text>
      </Grid.Col>
    </Grid>
  </Paper>
);

const ExtraItem: React.FC<{
  extra: Extra;
  index: number;
  onUpdate: (index: number, field: keyof Extra, value: string | number) => void;
  onRemove: (index: number) => void;
}> = ({ extra, index, onUpdate, onRemove }) => (
  <Paper key={extra.id} p="md" withBorder>
    <Grid>
      <Grid.Col span={4}>
        <TextInput
          label="Concepto"
          placeholder="Descripción del extra"
          value={extra.concepto}
          onChange={(e) => onUpdate(index, 'concepto', e.target.value)}
        />
      </Grid.Col>
      <Grid.Col span={3}>
        <NumberInput
          label="Monto"
          placeholder="0.00"
          value={extra.monto}
          onChange={(value) => onUpdate(index, 'monto', typeof value === 'number' ? value : 0)}
          decimalScale={2}
          min={0}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <TextInput
          label="Descripción"
          placeholder="Detalles adicionales"
          value={extra.descripcion}
          onChange={(e) => onUpdate(index, 'descripcion', e.target.value)}
        />
      </Grid.Col>
      <Grid.Col span={1}>
        <ActionIcon
          color="red"
          variant="light"
          onClick={() => onRemove(index)}
          style={{ marginTop: 25 }}
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Grid.Col>
    </Grid>
  </Paper>
);

const BillingStep: React.FC<BillingStepProps> = ({
  form,
  calculating,
  calculationResult,
  onCalculate,
  onShowDetails,
}) => {
  const handleUpdateExtra = (index: number, field: keyof Extra, value: string | number) => {
    updateExtraField(form.values.extras, { index, field, value }, form.setFieldValue);
  };

  const handleRemoveExtra = (index: number) => {
    removeExtra(form.values.extras, index, form.setFieldValue);
  };

  const handleAddExtra = () => {
    addExtra(form.values.extras, form.setFieldValue);
  };

  const hasRequiredData = !!(form.values.cliente && form.values.tramo);

  return (
    <Stack mt="md">
      <CalculationHeader
        onCalculate={onCalculate}
        calculating={calculating}
        hasRequiredData={hasRequiredData}
        calculationResult={calculationResult}
        onShowDetails={onShowDetails}
      />

      {calculationResult && <CalculationResult result={calculationResult} />}

      <Divider label="Extras" labelPosition="left" />

      <Group justify="apart">
        <Text fw={500}>Cargos Adicionales</Text>
        <Button leftSection={<IconPlus />} variant="light" onClick={handleAddExtra}>
          Agregar Extra
        </Button>
      </Group>

      {form.values.extras.map((extra: Extra, index: number) => (
        <ExtraItem
          key={extra.id}
          extra={extra}
          index={index}
          onUpdate={handleUpdateExtra}
          onRemove={handleRemoveExtra}
        />
      ))}

      {form.values.extras.length === 0 && (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          No hay extras agregados
        </Text>
      )}
    </Stack>
  );
};

export default BillingStep;
