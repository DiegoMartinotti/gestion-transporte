import { Group, Text, Button, Paper, Grid } from '@mantine/core';
import { IconCalculator, IconInfoCircle } from '@tabler/icons-react';

interface CalculationResult {
  montoBase: number;
  montoExtras: number;
  montoTotal: number;
}

interface TarifaCalculationPanelProps {
  calculating: boolean;
  calculationResult: CalculationResult | null;
  handleCalculateTarifa: () => void;
  setShowTarifaDetails: (value: boolean) => void;
  formatCurrency: (value: number) => string;
  isDisabled: boolean;
}

export function TarifaCalculationPanel({
  calculating,
  calculationResult,
  handleCalculateTarifa,
  setShowTarifaDetails,
  formatCurrency,
  isDisabled,
}: TarifaCalculationPanelProps) {
  return (
    <>
      <Group justify="apart">
        <Text fw={500}>Cálculo de Tarifa</Text>
        <Group>
          <Button
            leftSection={<IconCalculator />}
            onClick={handleCalculateTarifa}
            loading={calculating}
            disabled={isDisabled}
          >
            Calcular Tarifa
          </Button>
          {calculationResult && (
            <Button
              variant="light"
              leftSection={<IconInfoCircle />}
              onClick={() => setShowTarifaDetails(true)}
            >
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
    </>
  );
}
