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

const BillingStep: React.FC<BillingStepProps> = ({
  form,
  calculating,
  calculationResult,
  onCalculate,
  onShowDetails,
}) => {
  const handleUpdateExtra = (index: number, field: keyof Extra, value: string | number) => {
    updateExtraField(form.values.extras, index, field, value, form.setFieldValue);
  };

  const handleRemoveExtra = (index: number) => {
    removeExtra(form.values.extras, index, form.setFieldValue);
  };

  const handleAddExtra = () => {
    addExtra(form.values.extras, form.setFieldValue);
  };

  return (
    <Stack mt="md">
      <Group justify="apart">
        <Text fw={500}>Cálculo de Tarifa</Text>
        <Group>
          <Button
            leftSection={<IconCalculator />}
            onClick={onCalculate}
            loading={calculating}
            disabled={!form.values.cliente || !form.values.tramo}
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

      {calculationResult && (
        <Paper p="md" withBorder>
          <Grid>
            <Grid.Col span={4}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Monto Base
              </Text>
              <Text size="lg" fw={700}>
                {formatCurrency(calculationResult.montoBase)}
              </Text>
            </Grid.Col>
            <Grid.Col span={4}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Extras
              </Text>
              <Text size="lg" fw={700}>
                {formatCurrency(calculationResult.montoExtras)}
              </Text>
            </Grid.Col>
            <Grid.Col span={4}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Total
              </Text>
              <Text size="xl" fw={700} c="green">
                {formatCurrency(calculationResult.montoTotal)}
              </Text>
            </Grid.Col>
          </Grid>
        </Paper>
      )}

      <Divider label="Extras" labelPosition="left" />

      <Group justify="apart">
        <Text fw={500}>Cargos Adicionales</Text>
        <Button leftSection={<IconPlus />} variant="light" onClick={handleAddExtra}>
          Agregar Extra
        </Button>
      </Group>

      {form.values.extras.map((extra: Extra, index: number) => (
        <Paper key={extra.id} p="md" withBorder>
          <Grid>
            <Grid.Col span={4}>
              <TextInput
                label="Concepto"
                placeholder="Descripción del extra"
                value={extra.concepto}
                onChange={(e) => handleUpdateExtra(index, 'concepto', e.target.value)}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <NumberInput
                label="Monto"
                placeholder="0.00"
                value={extra.monto}
                onChange={(value) =>
                  handleUpdateExtra(index, 'monto', typeof value === 'number' ? value : 0)
                }
                decimalScale={2}
                min={0}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Descripción"
                placeholder="Detalles adicionales"
                value={extra.descripcion}
                onChange={(e) => handleUpdateExtra(index, 'descripcion', e.target.value)}
              />
            </Grid.Col>
            <Grid.Col span={1}>
              <ActionIcon
                color="red"
                variant="light"
                onClick={() => handleRemoveExtra(index)}
                style={{ marginTop: 25 }}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Grid.Col>
          </Grid>
        </Paper>
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
