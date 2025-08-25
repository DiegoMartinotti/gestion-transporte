import React from 'react';
import {
  Modal,
  Stack,
  Grid,
  Button,
  Select,
  NumberInput,
  LoadingOverlay,
  Paper,
  Group,
  Text,
  Title,
  Divider,
} from '@mantine/core';
import { CalculationParams, CalculationResult } from '../TramoDetail.types';

interface TramoCostCalculatorModalProps {
  opened: boolean;
  onClose: () => void;
  calculating: boolean;
  calculationParams: CalculationParams;
  setCalculationParams: React.Dispatch<React.SetStateAction<CalculationParams>>;
  calculationResult: CalculationResult | null;
  onCalculate: () => void;
}

const TramoCostCalculatorModal: React.FC<TramoCostCalculatorModalProps> = ({
  opened,
  onClose,
  calculating,
  calculationParams,
  setCalculationParams,
  calculationResult,
  onCalculate,
}) => {
  return (
    <Modal opened={opened} onClose={onClose} title="Calculadora de Costos" size="md">
      <LoadingOverlay visible={calculating} />
      <Stack gap="md">
        <Grid>
          <Grid.Col span={6}>
            <Select
              label="Tipo de Tarifa"
              data={[
                { value: 'TRMC', label: 'TRMC' },
                { value: 'TRMI', label: 'TRMI' },
              ]}
              value={calculationParams.tipo}
              onChange={(value) =>
                setCalculationParams((prev) => ({
                  ...prev,
                  tipo: value as 'TRMC' | 'TRMI',
                }))
              }
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <input
              type="date"
              style={{ width: '100%', padding: '8px' }}
              value={calculationParams.fecha}
              onChange={(e) =>
                setCalculationParams((prev) => ({
                  ...prev,
                  fecha: e.target.value,
                }))
              }
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              label="Cantidad"
              min={1}
              value={calculationParams.cantidad}
              onChange={(value) =>
                setCalculationParams((prev) => ({
                  ...prev,
                  cantidad: Number(value) || 1,
                }))
              }
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              label="Unidades"
              min={1}
              value={calculationParams.unidades}
              onChange={(value) =>
                setCalculationParams((prev) => ({
                  ...prev,
                  unidades: Number(value) || 1,
                }))
              }
            />
          </Grid.Col>
        </Grid>

        <Button onClick={onCalculate} loading={calculating}>
          Calcular Costo
        </Button>

        {calculationResult && (
          <Paper p="md" withBorder bg="green.0">
            <Stack gap="xs">
              <Title order={5}>Resultado del Cálculo</Title>
              <Group justify="space-between">
                <Text>Valor Base:</Text>
                <Text fw={500}>${calculationResult.desglose.valorBase}</Text>
              </Group>
              <Group justify="space-between">
                <Text>Peaje:</Text>
                <Text fw={500}>${calculationResult.desglose.peaje}</Text>
              </Group>
              <Divider />
              <Group justify="space-between">
                <Text fw={500}>Total:</Text>
                <Text fw={700} size="lg">
                  ${calculationResult.desglose.total}
                </Text>
              </Group>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Modal>
  );
};

export default TramoCostCalculatorModal;
